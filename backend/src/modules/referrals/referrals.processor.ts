// =============================================================================
// Beleqet — ReferralsProcessor
//
// BullMQ job state-machine for the referral reward pipeline:
//
//   VALIDATE_REFERRAL
//     → verifies referral still APPLIED, referred user is active
//     → dispatches REWARD_REFERRER
//   REWARD_REFERRER
//     → credits FreelancerWallet (pending balance)
//     → creates ReferralReward record
//     → marks Referral COMPLETED
//     → dispatches NOTIFY_REFERRAL (success)
//   NOTIFY_REFERRAL
//     → in-app + optional Telegram notification to the referrer
//   EXPIRE_REFERRALS
//     → scheduled sweep (from ReferralsScheduler)
//
// Idempotency: REWARD_REFERRER uses a unique jobId = "reward:<referralId>" so
// BullMQ de-duplicates any re-queued reward job at the queue level.
// =============================================================================

import {
  Processor,
  Process,
  OnQueueFailed,
  OnQueueCompleted,
} from '@nestjs/bull';
import { Logger, Injectable, Inject } from '@nestjs/common';
import { Job as BullJob } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { Redis } from 'ioredis';

import { PrismaService } from '../../prisma/prisma.service';
import {
  QUEUE_NAMES,
  REFERRAL_JOBS,
  NOTIFICATION_JOBS,
  REFERRAL_CONFIG,
} from '../queues/queues.constants';
import {
  ReferralsService,
  REFERRALS_REDIS,
  ValidateReferralPayload,
  RewardReferrerPayload,
  NotifyReferralPayload,
} from './referrals.service';

@Injectable()
@Processor(QUEUE_NAMES.REFERRALS)
export class ReferralsProcessor {
  private readonly logger = new Logger(ReferralsProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly referralsService: ReferralsService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue(QUEUE_NAMES.REFERRALS)    private readonly referralsQueue: Queue,
    @InjectQueue(QUEUE_NAMES.NOTIFICATIONS) private readonly notificationsQueue: Queue,
    @Inject(REFERRALS_REDIS) private readonly redis: Redis,
  ) {}

  // ── Step 1: Validate ──────────────────────────────────────────────────

  @Process(REFERRAL_JOBS.VALIDATE_REFERRAL)
  async handleValidate(job: BullJob<ValidateReferralPayload>) {
    const { referralId, referredUserId } = job.data;
    this.logger.log(`[validate-referral] referralId=${referralId}`);

    const referral = await this.prisma.referral.findUnique({
      where: { id: referralId },
      include: {
        referrer:     { select: { id: true, isActive: true } },
        referredUser: { select: { id: true, isActive: true } },
      },
    });

    if (!referral) {
      this.logger.warn(`[validate-referral] Referral ${referralId} not found — skipping`);
      return;
    }

    if (referral.status !== 'APPLIED') {
      this.logger.warn(
        `[validate-referral] Referral ${referralId} is ${referral.status} — skipping`,
      );
      return;
    }

    if (!referral.referrer.isActive) {
      this.logger.warn(`[validate-referral] Referrer ${referral.referrerId} is inactive — marking rejected`);
      await this.prisma.referral.update({
        where: { id: referralId },
        data:  { status: 'REJECTED' },
      });
      return;
    }

    // Validation passed — log the event
    await this.prisma.eventLog.create({
      data: {
        eventType:  'referral.validated',
        entityId:   referralId,
        entityType: 'Referral',
        payload:    { referralId, referredUserId },
        processedBy: ReferralsProcessor.name,
      },
    });

    this.logger.log(`[validate-referral] ${referralId} validated — awaiting hire event`);

    // Emit in-process event for any listeners
    this.eventEmitter.emit('referral.validated', { referralId, referredUserId });

    // Notify the referred user that their referral is active
    await this.notificationsQueue.add(NOTIFICATION_JOBS.SEND_IN_APP, {
      userId: referredUserId,
      type:   'referral.applied',
      title:  '🎉 Referral code applied!',
      body:   'You joined via a referral. Your referrer will earn a reward if you get hired through Beleqet.',
      metadata: { referralId },
    });
  }

  // ── Step 2: Reward the referrer ───────────────────────────────────────

  @Process(REFERRAL_JOBS.REWARD_REFERRER)
  async handleReward(job: BullJob<RewardReferrerPayload>) {
    const { referralId, referrerId, referredUserId, amount } = job.data;
    this.logger.log(`[reward-referrer] referralId=${referralId} referrerId=${referrerId} amount=${amount}`);

    // Idempotency: check if a ReferralReward already exists
    const existingReward = await this.prisma.referralReward.findUnique({
      where: { referralId },
    });
    if (existingReward) {
      this.logger.warn(`[reward-referrer] Reward for referral ${referralId} already exists — skipping`);
      return;
    }

    // Redis dedup key: prevents parallel reward runs during a retry storm
    const dedupKey = `referral:reward:lock:${referralId}`;
    const acquired = await this.redis.set(dedupKey, '1', 'EX', 60, 'NX');
    if (!acquired) {
      this.logger.warn(`[reward-referrer] Dedup lock active for ${referralId} — will retry`);
      throw new Error('Reward dedup lock active — retrying');
    }

    try {
      // Atomic transaction: upsert wallet + create reward record + mark referral complete
      await this.prisma.$transaction(async (tx) => {
        // Credit pending balance on the freelancer wallet
        const wallet = await tx.freelancerWallet.upsert({
          where:  { userId: referrerId },
          update: { pendingBalance: { increment: amount } },
          create: {
            userId:           referrerId,
            pendingBalance:   amount,
            availableBalance: 0,
          },
        });

        // Wallet transaction record
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type:     'CREDIT_PENDING',
            amount,
            note:     `Referral reward — referred user hired (referralId: ${referralId})`,
          },
        });

        // ReferralReward record
        await tx.referralReward.create({
          data: {
            referralId,
            userId:      referrerId,
            amount,
            currency:    'ETB',
            status:      'PAID',
            processedAt: new Date(),
          },
        });

        // Mark referral COMPLETED
        await tx.referral.update({
          where: { id: referralId },
          data:  { status: 'COMPLETED', completedAt: new Date() },
        });

        // Audit log
        await tx.eventLog.create({
          data: {
            eventType:  'referral.rewarded',
            entityId:   referralId,
            entityType: 'Referral',
            payload:    { referralId, referrerId, referredUserId, amount },
            processedBy: ReferralsProcessor.name,
          },
        });
      });

      this.logger.log(`[reward-referrer] ETB ${amount} credited to referrer ${referrerId}`);

      // Emit in-process event
      this.eventEmitter.emit('referral.completed', { referralId, referrerId });

      // Dispatch notification job
      await this.referralsQueue.add(
        REFERRAL_JOBS.NOTIFY_REFERRAL,
        {
          referralId,
          referrerId,
          referredUserId,
          eventType: 'completed',
        } as NotifyReferralPayload,
        { attempts: 3, backoff: { type: 'exponential', delay: 2_000 } },
      );
    } finally {
      // Hold the lock for 5 more seconds post-commit as a safety net
      await this.redis.expire(dedupKey, 5);
    }
  }

  // ── Step 3: Notify ───────────────────────────────────────────────────

  @Process(REFERRAL_JOBS.NOTIFY_REFERRAL)
  async handleNotify(job: BullJob<NotifyReferralPayload>) {
    const { referralId, referrerId, referredUserId, eventType } = job.data;
    this.logger.log(`[notify-referral] referralId=${referralId} event=${eventType}`);

    if (eventType === 'completed') {
      // In-app notification to referrer
      await this.notificationsQueue.add(NOTIFICATION_JOBS.SEND_IN_APP, {
        userId: referrerId,
        type:   'referral.rewarded',
        title:  `💸 Referral reward: ETB ${REFERRAL_CONFIG.REWARD_AMOUNT} earned!`,
        body:   'Someone you referred just got hired on Beleqet. Your reward has been added to your wallet.',
        metadata: { referralId, amount: REFERRAL_CONFIG.REWARD_AMOUNT },
      });

      // Telegram — only if the user has connected Telegram
      const referrer = await this.prisma.user.findUnique({
        where:  { id: referrerId },
        select: { telegramId: true, firstName: true },
      });

      if (referrer?.telegramId) {
        await this.notificationsQueue.add(NOTIFICATION_JOBS.SEND_TELEGRAM, {
          telegramId: referrer.telegramId,
          message: `💸 *Referral reward earned!*\n\nSomeone you referred just got hired on Beleqet.\n*ETB ${REFERRAL_CONFIG.REWARD_AMOUNT}* has been added to your wallet.\n\nView wallet → ${process.env.FRONTEND_URL ?? 'https://beleqet.com'}/dashboard/wallet`,
        });
      }
    } else if (eventType === 'expired') {
      await this.notificationsQueue.add(NOTIFICATION_JOBS.SEND_IN_APP, {
        userId: referrerId,
        type:   'referral.expired',
        title:  'A referral has expired',
        body:   'One of your referral links has expired without being claimed. Generate a new one to keep earning rewards.',
        metadata: { referralId },
      });
    }
  }

  // ── Step 4: Expire stale referrals (scheduler sweep) ─────────────────

  @Process(REFERRAL_JOBS.EXPIRE_REFERRALS)
  async handleExpire(job: BullJob) {
    this.logger.log('[expire-referrals] Running expiry sweep');
    const result = await this.referralsService.expireStaleReferrals();
    this.logger.log(`[expire-referrals] Expired ${result.expired} referral(s)`);
    return result;
  }

  // ── Queue lifecycle hooks ─────────────────────────────────────────────

  @OnQueueFailed()
  async onFailed(job: BullJob, error: Error) {
    this.logger.error(
      `[referrals-queue] Job failed: [${job.name}] id=${job.id} attempt=${job.attemptsMade}/${job.opts.attempts ?? 3}`,
      error.stack,
    );

    // After final attempt on REWARD_REFERRER — flag the referral for manual review
    if (
      job.name === REFERRAL_JOBS.REWARD_REFERRER &&
      job.attemptsMade >= (job.opts.attempts ?? 3)
    ) {
      const data = job.data as RewardReferrerPayload;
      await this.prisma.eventLog.create({
        data: {
          eventType:  'referral.reward_failed',
          entityId:   data.referralId,
          entityType: 'Referral',
          payload:    { ...data, error: error.message },
          processedBy: ReferralsProcessor.name,
        },
      }).catch(() => null); // don't throw from error handler
    }
  }

  @OnQueueCompleted()
  onCompleted(job: BullJob) {
    this.logger.debug(`[referrals-queue] Job completed: [${job.name}] id=${job.id}`);
  }
}
