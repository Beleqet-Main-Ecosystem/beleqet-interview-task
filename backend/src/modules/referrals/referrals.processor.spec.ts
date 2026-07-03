import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Job as BullJob } from 'bull';

import { ReferralsProcessor } from './referrals.processor';
import { ReferralsService, REFERRALS_REDIS } from './referrals.service';
import { PrismaService } from '../../prisma/prisma.service';
import {
  QUEUE_NAMES,
  REFERRAL_JOBS,
  NOTIFICATION_JOBS,
  REFERRAL_CONFIG,
} from '../queues/queues.constants';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Build a minimal Bull Job stub */
function makeJob<T>(name: string, data: T, overrides: Partial<BullJob> = {}): BullJob<T> {
  return {
    id:           'job-id-1',
    name,
    data,
    opts:         { attempts: 3 },
    attemptsMade: 1,
    queue:        { add: jest.fn() } as any,
    ...overrides,
  } as unknown as BullJob<T>;
}

const makeReferral = (overrides = {}) => ({
  id:             'referral-uuid-1',
  referrerId:     'user-uuid-1',
  referredUserId: 'user-uuid-2',
  referralCode:   'REF-AABBCCDD',
  status:         'APPLIED',
  expiresAt:      new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  referrer:       { id: 'user-uuid-1', isActive: true },
  referredUser:   { id: 'user-uuid-2', isActive: true },
  ...overrides,
});

// ── Mock providers ────────────────────────────────────────────────────────────

const mockPrisma = {
  referral:         { findUnique: jest.fn(), update: jest.fn() },
  referralReward:   { findUnique: jest.fn(), create: jest.fn() },
  eventLog:         { create: jest.fn() },
  freelancerWallet: { upsert: jest.fn() },
  walletTransaction:{ create: jest.fn() },
  user:             { findUnique: jest.fn() },
  $transaction:     jest.fn(),
};

const mockReferralsQueue  = { add: jest.fn() };
const mockNotificationsQueue = { add: jest.fn() };

const mockRedis = {
  set:    jest.fn(),
  get:    jest.fn(),
  del:    jest.fn(),
  expire: jest.fn(),
};

const mockEventEmitter = {
  emit:        jest.fn(),
  on:          jest.fn(),
  addListener: jest.fn(),
};

const mockReferralsService = {
  expireStaleReferrals: jest.fn(),
};

// ── Test suite ────────────────────────────────────────────────────────────────

describe('ReferralsProcessor', () => {
  let processor: ReferralsProcessor;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralsProcessor,
        { provide: PrismaService,                            useValue: mockPrisma },
        { provide: ReferralsService,                         useValue: mockReferralsService },
        { provide: EventEmitter2,                            useValue: mockEventEmitter },
        { provide: getQueueToken(QUEUE_NAMES.REFERRALS),     useValue: mockReferralsQueue },
        { provide: getQueueToken(QUEUE_NAMES.NOTIFICATIONS), useValue: mockNotificationsQueue },
        { provide: REFERRALS_REDIS,                          useValue: mockRedis },
      ],
    }).compile();

    processor = module.get<ReferralsProcessor>(ReferralsProcessor);
  });

  it('should be defined', () => {
    expect(processor).toBeDefined();
  });

  // ── handleValidate ────────────────────────────────────────────────────────

  describe('handleValidate', () => {
    it('skips gracefully when referral is not found', async () => {
      mockPrisma.referral.findUnique.mockResolvedValue(null);

      const job = makeJob(REFERRAL_JOBS.VALIDATE_REFERRAL, {
        referralId: 'missing-id', referredUserId: 'user-uuid-2',
      });

      await processor.handleValidate(job);

      expect(mockPrisma.eventLog.create).not.toHaveBeenCalled();
      expect(mockNotificationsQueue.add).not.toHaveBeenCalled();
    });

    it('skips when referral is no longer APPLIED', async () => {
      mockPrisma.referral.findUnique.mockResolvedValue(makeReferral({ status: 'COMPLETED' }));

      const job = makeJob(REFERRAL_JOBS.VALIDATE_REFERRAL, {
        referralId: 'referral-uuid-1', referredUserId: 'user-uuid-2',
      });

      await processor.handleValidate(job);

      expect(mockPrisma.eventLog.create).not.toHaveBeenCalled();
    });

    it('marks referral REJECTED when referrer account is inactive', async () => {
      mockPrisma.referral.findUnique.mockResolvedValue(
        makeReferral({ referrer: { id: 'user-uuid-1', isActive: false } }),
      );
      mockPrisma.referral.update.mockResolvedValue({});

      const job = makeJob(REFERRAL_JOBS.VALIDATE_REFERRAL, {
        referralId: 'referral-uuid-1', referredUserId: 'user-uuid-2',
      });

      await processor.handleValidate(job);

      expect(mockPrisma.referral.update).toHaveBeenCalledWith({
        where: { id: 'referral-uuid-1' },
        data:  { status: 'REJECTED' },
      });
    });

    it('logs event, emits in-process event, and notifies referred user on success', async () => {
      mockPrisma.referral.findUnique.mockResolvedValue(makeReferral());
      mockPrisma.eventLog.create.mockResolvedValue({});
      mockNotificationsQueue.add.mockResolvedValue({});

      const job = makeJob(REFERRAL_JOBS.VALIDATE_REFERRAL, {
        referralId: 'referral-uuid-1', referredUserId: 'user-uuid-2',
      });

      await processor.handleValidate(job);

      expect(mockPrisma.eventLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ eventType: 'referral.validated' }),
        }),
      );
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'referral.validated',
        expect.objectContaining({ referralId: 'referral-uuid-1' }),
      );
      expect(mockNotificationsQueue.add).toHaveBeenCalledWith(
        NOTIFICATION_JOBS.SEND_IN_APP,
        expect.objectContaining({ userId: 'user-uuid-2', type: 'referral.applied' }),
      );
    });
  });

  // ── handleReward ──────────────────────────────────────────────────────────

  describe('handleReward', () => {
    const rewardPayload = {
      referralId:     'referral-uuid-1',
      referrerId:     'user-uuid-1',
      referredUserId: 'user-uuid-2',
      amount:         500,
    };

    it('skips idempotently when ReferralReward already exists', async () => {
      mockPrisma.referralReward.findUnique.mockResolvedValue({ id: 'reward-1' });

      const job = makeJob(REFERRAL_JOBS.REWARD_REFERRER, rewardPayload);
      await processor.handleReward(job);

      expect(mockRedis.set).not.toHaveBeenCalled();
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws and retries when redis dedup lock is already held', async () => {
      mockPrisma.referralReward.findUnique.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue(null); // lock NOT acquired

      const job = makeJob(REFERRAL_JOBS.REWARD_REFERRER, rewardPayload);

      await expect(processor.handleReward(job)).rejects.toThrow('Reward dedup lock active');
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('executes full transaction, emits event, and dispatches NOTIFY_REFERRAL', async () => {
      mockPrisma.referralReward.findUnique.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK'); // lock acquired
      mockRedis.expire.mockResolvedValue(1);
      mockPrisma.$transaction.mockResolvedValue(undefined);
      mockReferralsQueue.add.mockResolvedValue({});

      const job = makeJob(REFERRAL_JOBS.REWARD_REFERRER, rewardPayload);
      await processor.handleReward(job);

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockEventEmitter.emit).toHaveBeenCalledWith(
        'referral.completed',
        expect.objectContaining({ referralId: 'referral-uuid-1' }),
      );
      expect(mockReferralsQueue.add).toHaveBeenCalledWith(
        REFERRAL_JOBS.NOTIFY_REFERRAL,
        expect.objectContaining({ referralId: 'referral-uuid-1', eventType: 'completed' }),
        expect.any(Object),
      );
    });

    it('releases the redis lock (expire) even when transaction throws', async () => {
      mockPrisma.referralReward.findUnique.mockResolvedValue(null);
      mockRedis.set.mockResolvedValue('OK');
      mockRedis.expire.mockResolvedValue(1);
      mockPrisma.$transaction.mockRejectedValue(new Error('DB failure'));

      const job = makeJob(REFERRAL_JOBS.REWARD_REFERRER, rewardPayload);

      await expect(processor.handleReward(job)).rejects.toThrow('DB failure');
      expect(mockRedis.expire).toHaveBeenCalledWith(
        'referral:reward:lock:referral-uuid-1',
        5,
      );
    });
  });

  // ── handleNotify ──────────────────────────────────────────────────────────

  describe('handleNotify', () => {
    const basePayload = {
      referralId:     'referral-uuid-1',
      referrerId:     'user-uuid-1',
      referredUserId: 'user-uuid-2',
    };

    it('sends in-app notification to referrer on completed event', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ telegramId: null, firstName: 'Abel' });
      mockNotificationsQueue.add.mockResolvedValue({});

      const job = makeJob(REFERRAL_JOBS.NOTIFY_REFERRAL, { ...basePayload, eventType: 'completed' as const });
      await processor.handleNotify(job);

      expect(mockNotificationsQueue.add).toHaveBeenCalledWith(
        NOTIFICATION_JOBS.SEND_IN_APP,
        expect.objectContaining({
          userId: 'user-uuid-1',
          type:   'referral.rewarded',
          metadata: expect.objectContaining({ amount: REFERRAL_CONFIG.REWARD_AMOUNT }),
        }),
      );
    });

    it('also sends Telegram notification when referrer has telegramId', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ telegramId: '987654321', firstName: 'Abel' });
      mockNotificationsQueue.add.mockResolvedValue({});

      const job = makeJob(REFERRAL_JOBS.NOTIFY_REFERRAL, { ...basePayload, eventType: 'completed' as const });
      await processor.handleNotify(job);

      const calls = mockNotificationsQueue.add.mock.calls.map(c => c[0]);
      expect(calls).toContain(NOTIFICATION_JOBS.SEND_TELEGRAM);
    });

    it('does NOT send Telegram when telegramId is null', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ telegramId: null, firstName: 'Abel' });
      mockNotificationsQueue.add.mockResolvedValue({});

      const job = makeJob(REFERRAL_JOBS.NOTIFY_REFERRAL, { ...basePayload, eventType: 'completed' as const });
      await processor.handleNotify(job);

      const calls = mockNotificationsQueue.add.mock.calls.map(c => c[0]);
      expect(calls).not.toContain(NOTIFICATION_JOBS.SEND_TELEGRAM);
    });

    it('sends expiry notification on expired event', async () => {
      mockNotificationsQueue.add.mockResolvedValue({});

      const job = makeJob(REFERRAL_JOBS.NOTIFY_REFERRAL, { ...basePayload, eventType: 'expired' as const });
      await processor.handleNotify(job);

      expect(mockNotificationsQueue.add).toHaveBeenCalledWith(
        NOTIFICATION_JOBS.SEND_IN_APP,
        expect.objectContaining({ userId: 'user-uuid-1', type: 'referral.expired' }),
      );
    });
  });

  // ── handleExpire ──────────────────────────────────────────────────────────

  describe('handleExpire', () => {
    it('delegates to ReferralsService.expireStaleReferrals and returns result', async () => {
      mockReferralsService.expireStaleReferrals.mockResolvedValue({ expired: 7 });

      const job = makeJob(REFERRAL_JOBS.EXPIRE_REFERRALS, {});
      const result = await processor.handleExpire(job);

      expect(mockReferralsService.expireStaleReferrals).toHaveBeenCalledTimes(1);
      expect(result).toEqual({ expired: 7 });
    });
  });

  // ── onFailed ──────────────────────────────────────────────────────────────

  describe('onFailed', () => {
    it('creates an EventLog audit entry after REWARD_REFERRER exhausts all attempts', async () => {
      mockPrisma.eventLog.create.mockResolvedValue({});

      const job = makeJob(
        REFERRAL_JOBS.REWARD_REFERRER,
        {
          referralId: 'referral-uuid-1',
          referrerId: 'user-uuid-1',
          referredUserId: 'user-uuid-2',
          amount: 500,
        },
        { attemptsMade: 3, opts: { attempts: 3 } } as any,
      );

      await processor.onFailed(job, new Error('Payment service down'));

      expect(mockPrisma.eventLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            eventType:  'referral.reward_failed',
            entityId:   'referral-uuid-1',
            entityType: 'Referral',
            payload:    expect.objectContaining({ error: 'Payment service down' }),
          }),
        }),
      );
    });

    it('does NOT create EventLog for non-REWARD_REFERRER job failures', async () => {
      const job = makeJob(
        REFERRAL_JOBS.VALIDATE_REFERRAL,
        { referralId: 'r1', referredUserId: 'u2' },
        { attemptsMade: 3, opts: { attempts: 3 } } as any,
      );

      await processor.onFailed(job, new Error('some error'));

      expect(mockPrisma.eventLog.create).not.toHaveBeenCalled();
    });

    it('does NOT create EventLog when attempts are not yet exhausted', async () => {
      const job = makeJob(
        REFERRAL_JOBS.REWARD_REFERRER,
        { referralId: 'r1', referrerId: 'u1', referredUserId: 'u2', amount: 500 },
        { attemptsMade: 1, opts: { attempts: 3 } } as any,
      );

      await processor.onFailed(job, new Error('transient'));

      expect(mockPrisma.eventLog.create).not.toHaveBeenCalled();
    });
  });
});
