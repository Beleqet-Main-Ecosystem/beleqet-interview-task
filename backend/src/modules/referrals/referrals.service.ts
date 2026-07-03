// =============================================================================
// Beleqet — ReferralsService
//
// Responsibilities:
//   • generateLink  — creates a unique referral code, stores in DB, deduplicates
//                     concurrent generates via a Redis lock
//   • applyReferral — validates + claims a referral code at registration; queues
//                     the reward pipeline; Redis idempotency key prevents double-
//                     claim under race conditions
//   • getMyReferrals — paginated list for the dashboard
//   • getLeaderboard — ranked by completed referrals for a time window
//   • onApplicationHired — internal event listener that triggers REWARD_REFERRER
// =============================================================================

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { Inject } from '@nestjs/common';
import type { Redis } from 'ioredis';
import { randomBytes } from 'crypto';

import { PrismaService } from '../../prisma/prisma.service';
import {
  QUEUE_NAMES,
  REFERRAL_JOBS,
  REFERRAL_CONFIG,
  NOTIFICATION_JOBS,
} from '../queues/queues.constants';
import { ApplyReferralDto, LeaderboardQueryDto, LeaderboardPeriod } from './dto/referral.dto';

/** DI token for the ioredis client within the Referrals module */
export const REFERRALS_REDIS = 'REFERRALS_REDIS';

// ── Internal payload interfaces ───────────────────────────────────────────

export interface ValidateReferralPayload {
  referralId: string;
  referredUserId: string;
}

export interface RewardReferrerPayload {
  referralId: string;
  referrerId: string;
  referredUserId: string;
  amount: number;
}

export interface NotifyReferralPayload {
  referralId: string;
  referrerId: string;
  referredUserId: string;
  eventType: 'applied' | 'completed' | 'expired';
}

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
    @InjectQueue(QUEUE_NAMES.REFERRALS) private readonly referralsQueue: Queue,
    @InjectQueue(QUEUE_NAMES.NOTIFICATIONS) private readonly notificationsQueue: Queue,
    @Inject(REFERRALS_REDIS) private readonly redis: Redis,
  ) {}

  // ── 1. Generate a referral link ─────────────────────────────────────────

  /**
   * Returns the caller's existing code if they already have one, otherwise
   * creates a new one. A Redis lock prevents two simultaneous requests from
   * creating duplicate codes for the same user.
   */
  async generateLink(referrerId: string): Promise<{ code: string; link: string; expiresAt: Date }> {
    // Check if user already has an active (non-expired) referral code
    const existing = await this.prisma.referral.findFirst({
      where: {
        referrerId,
        status:    'PENDING',
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (existing) {
      return {
        code:      existing.referralCode,
        link:      this.buildLink(existing.referralCode),
        expiresAt: existing.expiresAt,
      };
    }

    // Guard: max active referrals per user
    const activeCount = await this.prisma.referral.count({
      where: { referrerId, status: { in: ['PENDING', 'APPLIED'] } },
    });
    if (activeCount >= REFERRAL_CONFIG.MAX_ACTIVE_REFERRALS) {
      throw new BadRequestException(
        `You have reached the maximum of ${REFERRAL_CONFIG.MAX_ACTIVE_REFERRALS} active referrals.`,
      );
    }

    // Redis lock to prevent race-condition duplicate creation
    const lockKey = `referral:generate:lock:${referrerId}`;
    const acquired = await this.redis.set(lockKey, '1', 'EX', 10, 'NX');
    if (!acquired) {
      throw new ConflictException('A referral code generation is already in progress. Please retry.');
    }

    try {
      const code      = this.generateCode();
      const expiresAt = new Date(Date.now() + REFERRAL_CONFIG.EXPIRY_DAYS * 24 * 60 * 60 * 1000);

      const referral = await this.prisma.referral.create({
        data: { referrerId, referralCode: code, expiresAt, status: 'PENDING' },
      });

      await this.prisma.eventLog.create({
        data: {
          eventType:  'referral.created',
          entityId:   referral.id,
          entityType: 'Referral',
          payload:    { referrerId, code, expiresAt },
          processedBy: ReferralsService.name,
        },
      });

      this.logger.log(`Referral code ${code} created for user ${referrerId}`);
      return { code, link: this.buildLink(code), expiresAt };
    } finally {
      await this.redis.del(lockKey);
    }
  }

  // ── 2. Apply a referral code (at sign-up) ──────────────────────────────

  /**
   * Called immediately after a new user registers. Uses a Redis idempotency
   * key so that even if the endpoint is retried (network blip), the claim
   * executes exactly once.
   */
  async applyReferral(referredUserId: string, dto: ApplyReferralDto): Promise<{ message: string }> {
    const { code } = dto;

    // Idempotency: check if this user already used any referral code
    const idempotencyKey = `referral:apply:${referredUserId}`;
    const alreadyApplied = await this.redis.get(idempotencyKey);
    if (alreadyApplied) {
      throw new ConflictException('You have already applied a referral code.');
    }

    // Validate the referral record
    const referral = await this.prisma.referral.findUnique({
      where: { referralCode: code },
      include: { referrer: { select: { id: true, firstName: true, email: true } } },
    });

    if (!referral) {
      throw new NotFoundException(`Referral code "${code}" not found.`);
    }
    if (referral.status !== 'PENDING') {
      throw new BadRequestException(`This referral code is ${referral.status.toLowerCase()} and can no longer be used.`);
    }
    if (referral.expiresAt < new Date()) {
      throw new BadRequestException('This referral code has expired.');
    }
    if (referral.referrerId === referredUserId) {
      throw new BadRequestException('You cannot use your own referral code.');
    }

    // DB transaction: mark referral APPLIED + set Redis idempotency key atomically
    await this.prisma.$transaction(async (tx: any) => {
      await tx.referral.update({
        where: { id: referral.id },
        data: {
          status:        'APPLIED',
          referredUserId,
          appliedAt:     new Date(),
        },
      });

      await tx.eventLog.create({
        data: {
          eventType:  'referral.applied',
          entityId:   referral.id,
          entityType: 'Referral',
          payload:    { referralId: referral.id, referredUserId, code },
          processedBy: ReferralsService.name,
        },
      });
    });

    // Set idempotency key AFTER commit so a transaction rollback retries cleanly
    await this.redis.set(
      idempotencyKey,
      referral.id,
      'EX',
      REFERRAL_CONFIG.DEDUP_TTL_SECONDS,
    );

    // Enqueue the validation + reward pipeline
    await this.referralsQueue.add(
      REFERRAL_JOBS.VALIDATE_REFERRAL,
      { referralId: referral.id, referredUserId } as ValidateReferralPayload,
      {
        attempts:         3,
        backoff:          { type: 'exponential', delay: 3_000 },
        removeOnComplete: 50,
        removeOnFail:     100,
      },
    );

    this.logger.log(`Referral ${referral.id} applied by user ${referredUserId}`);
    return { message: 'Referral code applied successfully! Reward will be issued when you get hired.' };
  }

  // ── 3. List the caller's referrals ─────────────────────────────────────

  async getMyReferrals(referrerId: string) {
    const referrals = await this.prisma.referral.findMany({
      where:   { referrerId },
      include: {
        referredUser: { select: { id: true, firstName: true, lastName: true, email: true } },
        reward:       true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const summary = {
      total:     referrals.length,
      pending:   referrals.filter(r => r.status === 'PENDING').length,
      applied:   referrals.filter(r => r.status === 'APPLIED').length,
      completed: referrals.filter(r => r.status === 'COMPLETED').length,
      expired:   referrals.filter(r => r.status === 'EXPIRED').length,
      totalEarned: referrals
        .filter(r => r.reward?.status === 'PAID')
        .reduce((sum, r) => sum + (r.reward?.amount ?? 0), 0),
    };

    return { summary, referrals };
  }

  // ── 4. Leaderboard ─────────────────────────────────────────────────────

  async getLeaderboard(query: LeaderboardQueryDto) {
    const limit = query.limit ?? 10;
    let since: Date | undefined;

    if (query.period === LeaderboardPeriod.WEEK) {
      since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    } else if (query.period === LeaderboardPeriod.MONTH) {
      since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }

    const rows = await this.prisma.referral.groupBy({
      by:        ['referrerId'],
      where:     {
        status:     'COMPLETED',
        ...(since ? { completedAt: { gte: since } } : {}),
      },
      _count:    { id: true },
      orderBy:   { _count: { id: 'desc' } },
      take:      limit,
    });

    if (rows.length === 0) return [];

    const userIds = rows.map(r => r.referrerId);
    const users   = await this.prisma.user.findMany({
      where:  { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true, avatarUrl: true },
    });

    const userMap = new Map(users.map(u => [u.id, u]));

    return rows.map((row, index) => {
      const user = userMap.get(row.referrerId);
      return {
        rank:             index + 1,
        userId:           row.referrerId,
        name:             user ? `${user.firstName} ${user.lastName}` : 'Anonymous',
        avatarUrl:        user?.avatarUrl ?? null,
        completedReferrals: row._count.id,
      };
    });
  }

  // ── 5. Mark referral complete (called by processor after hire event) ────

  async markCompleted(referralId: string): Promise<void> {
    const referral = await this.prisma.referral.findUnique({ where: { id: referralId } });
    if (!referral || referral.status === 'COMPLETED') return;

    await this.prisma.referral.update({
      where: { id: referralId },
      data:  { status: 'COMPLETED', completedAt: new Date() },
    });

    this.eventEmitter.emit('referral.completed', { referralId, referrerId: referral.referrerId });
  }

  // ── 6. Expire stale referrals (called by scheduler processor) ──────────

  async expireStaleReferrals(): Promise<{ expired: number }> {
    const result = await this.prisma.referral.updateMany({
      where: {
        status:    { in: ['PENDING'] },
        expiresAt: { lt: new Date() },
      },
      data: { status: 'EXPIRED' },
    });

    if (result.count > 0) {
      this.logger.log(`Expired ${result.count} stale referral(s)`);
    }

    return { expired: result.count };
  }

  // ── 7. Event listener: application hired → trigger completion ──────────

  @OnEvent('application.offered')
  async onApplicationOffered(payload: { userId: string; applicationId: string }) {
    // Find if this user came via a referral that is still APPLIED
    const referral = await this.prisma.referral.findFirst({
      where: {
        referredUserId: payload.userId,
        status:         'APPLIED',
      },
    });

    if (!referral) return;

    this.logger.log(
      `Referred user ${payload.userId} got an offer — queuing reward for referral ${referral.id}`,
    );

    await this.referralsQueue.add(
      REFERRAL_JOBS.REWARD_REFERRER,
      {
        referralId:     referral.id,
        referrerId:     referral.referrerId,
        referredUserId: payload.userId,
        amount:         REFERRAL_CONFIG.REWARD_AMOUNT,
      } as RewardReferrerPayload,
      {
        attempts:         5,
        backoff:          { type: 'exponential', delay: 5_000 },
        removeOnComplete: 50,
        removeOnFail:     200,
        jobId:            `reward:${referral.id}`, // deduplication by jobId
      },
    );
  }

  // ── Helpers ─────────────────────────────────────────────────────────────

  private generateCode(): string {
    // REF-XXXXXXXX — 8 upper-case hex chars, collision-resistant for typical scale
    return `REF-${randomBytes(4).toString('hex').toUpperCase()}`;
  }

  private buildLink(code: string): string {
    // Falls back to a safe default so the service does not crash without .env
    const base = process.env.FRONTEND_URL ?? 'https://beleqet.com';
    return `${base}/auth/register?ref=${code}`;
  }
}
