import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { getQueueToken } from '@nestjs/bull';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { ReferralsService, REFERRALS_REDIS } from './referrals.service';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUE_NAMES, REFERRAL_CONFIG } from '../queues/queues.constants';
import { LeaderboardPeriod } from './dto/referral.dto';

// ── Shared mock factories ─────────────────────────────────────────────────

const makeMockReferral = (overrides = {}) => ({
  id:           'referral-uuid-1',
  referrerId:   'user-uuid-1',
  referralCode: 'REF-AABBCCDD',
  status:       'PENDING',
  expiresAt:    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days ahead
  appliedAt:    null,
  completedAt:  null,
  metadata:     null,
  createdAt:    new Date(),
  updatedAt:    new Date(),
  referredUserId: null,
  referrer: { id: 'user-uuid-1', firstName: 'Abel', email: 'abel@test.com' },
  ...overrides,
});

// ── Mock providers ─────────────────────────────────────────────────────────

const mockPrisma = {
  referral: {
    findFirst:   jest.fn(),
    findUnique:  jest.fn(),
    findMany:    jest.fn(),
    create:      jest.fn(),
    update:      jest.fn(),
    updateMany:  jest.fn(),
    count:       jest.fn(),
    groupBy:     jest.fn(),
  },
  jobAlert:   { findMany: jest.fn() },
  eventLog:   { create: jest.fn() },
  user:       { findMany: jest.fn() },
  $transaction: jest.fn(),
};

const mockReferralsQueue = {
  add: jest.fn(),
};

const mockNotificationsQueue = {
  add: jest.fn(),
};

const mockRedis = {
  set:    jest.fn(),
  get:    jest.fn(),
  del:    jest.fn(),
  expire: jest.fn(),
};

const mockEventEmitter = {
  emit:    jest.fn(),
  on:      jest.fn(),
  addListener: jest.fn(),
};

// ── Test suite ─────────────────────────────────────────────────────────────

describe('ReferralsService', () => {
  let service: ReferralsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReferralsService,
        { provide: PrismaService,                            useValue: mockPrisma },
        { provide: getQueueToken(QUEUE_NAMES.REFERRALS),     useValue: mockReferralsQueue },
        { provide: getQueueToken(QUEUE_NAMES.NOTIFICATIONS), useValue: mockNotificationsQueue },
        { provide: EventEmitter2,                            useValue: mockEventEmitter },
        { provide: REFERRALS_REDIS,                          useValue: mockRedis },
      ],
    }).compile();

    service = module.get<ReferralsService>(ReferralsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ── generateLink ──────────────────────────────────────────────────────────

  describe('generateLink', () => {
    it('returns existing active code without creating a new one', async () => {
      const existing = makeMockReferral();
      mockPrisma.referral.findFirst.mockResolvedValue(existing);

      const result = await service.generateLink('user-uuid-1');

      expect(result.code).toBe('REF-AABBCCDD');
      expect(result.link).toContain('REF-AABBCCDD');
      expect(mockPrisma.referral.create).not.toHaveBeenCalled();
    });

    it('creates a new code when no active one exists', async () => {
      mockPrisma.referral.findFirst.mockResolvedValue(null);
      mockPrisma.referral.count.mockResolvedValue(0);
      mockRedis.set.mockResolvedValue('OK'); // lock acquired
      mockPrisma.referral.create.mockImplementation(({ data }: any) =>
        Promise.resolve(makeMockReferral({ referralCode: data.referralCode })),
      );
      mockPrisma.eventLog.create.mockResolvedValue({});

      const result = await service.generateLink('user-uuid-1');

      expect(result.code).toMatch(/^REF-[0-9A-F]{8}$/);
      expect(result.link).toContain(result.code);
      expect(mockPrisma.referral.create).toHaveBeenCalledTimes(1);
      expect(mockRedis.del).toHaveBeenCalledWith('referral:generate:lock:user-uuid-1');
    });

    it('releases redis lock even when DB create throws', async () => {
      mockPrisma.referral.findFirst.mockResolvedValue(null);
      mockPrisma.referral.count.mockResolvedValue(0);
      mockRedis.set.mockResolvedValue('OK');
      mockPrisma.referral.create.mockRejectedValue(new Error('DB error'));

      await expect(service.generateLink('user-uuid-1')).rejects.toThrow('DB error');
      expect(mockRedis.del).toHaveBeenCalledWith('referral:generate:lock:user-uuid-1');
    });

    it('throws ConflictException when redis lock is already held', async () => {
      mockPrisma.referral.findFirst.mockResolvedValue(null);
      mockPrisma.referral.count.mockResolvedValue(0);
      mockRedis.set.mockResolvedValue(null); // lock NOT acquired

      await expect(service.generateLink('user-uuid-1')).rejects.toThrow(ConflictException);
    });

    it('throws BadRequestException when user exceeds max active referrals', async () => {
      mockPrisma.referral.findFirst.mockResolvedValue(null);
      mockPrisma.referral.count.mockResolvedValue(REFERRAL_CONFIG.MAX_ACTIVE_REFERRALS);

      await expect(service.generateLink('user-uuid-1')).rejects.toThrow(BadRequestException);
      expect(mockPrisma.referral.create).not.toHaveBeenCalled();
    });

    it('includes FRONTEND_URL in generated link', async () => {
      const originalEnv = process.env.FRONTEND_URL;
      process.env.FRONTEND_URL = 'https://beleqet.com';

      mockPrisma.referral.findFirst.mockResolvedValue(null);
      mockPrisma.referral.count.mockResolvedValue(0);
      mockRedis.set.mockResolvedValue('OK');
      mockPrisma.referral.create.mockImplementation(({ data }: any) =>
        Promise.resolve(makeMockReferral({ referralCode: data.referralCode })),
      );
      mockPrisma.eventLog.create.mockResolvedValue({});

      const result = await service.generateLink('user-uuid-1');

      expect(result.link).toMatch(/^https:\/\/beleqet\.com\/auth\/register\?ref=REF-[0-9A-F]{8}$/);
      expect(result.link).toContain(result.code);
      process.env.FRONTEND_URL = originalEnv;
    });
  });

  // ── applyReferral ─────────────────────────────────────────────────────────

  describe('applyReferral', () => {
    const dto = { code: 'REF-AABBCCDD' };

    it('applies a valid referral code and queues VALIDATE_REFERRAL', async () => {
      mockRedis.get.mockResolvedValue(null); // not already applied
      mockPrisma.referral.findUnique.mockResolvedValue(makeMockReferral());
      mockPrisma.$transaction.mockResolvedValue(undefined);
      mockRedis.set.mockResolvedValue('OK');
      mockReferralsQueue.add.mockResolvedValue({});

      const result = await service.applyReferral('user-uuid-2', dto);

      expect(result.message).toContain('applied successfully');
      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockReferralsQueue.add).toHaveBeenCalledWith(
        'validate-referral',
        expect.objectContaining({ referralId: 'referral-uuid-1', referredUserId: 'user-uuid-2' }),
        expect.any(Object),
      );
    });

    it('throws ConflictException when user already applied a code (redis idempotency)', async () => {
      mockRedis.get.mockResolvedValue('referral-uuid-1'); // already applied

      await expect(service.applyReferral('user-uuid-2', dto)).rejects.toThrow(ConflictException);
      expect(mockPrisma.referral.findUnique).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when code does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.referral.findUnique.mockResolvedValue(null);

      await expect(service.applyReferral('user-uuid-2', dto)).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException for self-referral', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.referral.findUnique.mockResolvedValue(makeMockReferral({ referrerId: 'user-uuid-2' }));

      await expect(service.applyReferral('user-uuid-2', dto)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when code is already APPLIED', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.referral.findUnique.mockResolvedValue(makeMockReferral({ status: 'APPLIED' }));

      await expect(service.applyReferral('user-uuid-2', dto)).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException when code is expired', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.referral.findUnique.mockResolvedValue(
        makeMockReferral({ expiresAt: new Date(Date.now() - 1000) }),
      );

      await expect(service.applyReferral('user-uuid-2', dto)).rejects.toThrow(BadRequestException);
    });

    it('sets redis idempotency key after successful transaction', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.referral.findUnique.mockResolvedValue(makeMockReferral());
      mockPrisma.$transaction.mockResolvedValue(undefined);
      mockRedis.set.mockResolvedValue('OK');
      mockReferralsQueue.add.mockResolvedValue({});

      await service.applyReferral('user-uuid-2', dto);

      expect(mockRedis.set).toHaveBeenCalledWith(
        'referral:apply:user-uuid-2',
        'referral-uuid-1',
        'EX',
        REFERRAL_CONFIG.DEDUP_TTL_SECONDS,
      );
    });
  });

  // ── getMyReferrals ────────────────────────────────────────────────────────

  describe('getMyReferrals', () => {
    it('returns referrals with correct summary counts', async () => {
      mockPrisma.referral.findMany.mockResolvedValue([
        makeMockReferral({ status: 'COMPLETED', reward: { status: 'PAID', amount: 500 } }),
        makeMockReferral({ id: 'r2', status: 'PENDING',   reward: null }),
        makeMockReferral({ id: 'r3', status: 'APPLIED',   reward: null }),
        makeMockReferral({ id: 'r4', status: 'EXPIRED',   reward: null }),
      ]);

      const result = await service.getMyReferrals('user-uuid-1');

      expect(result.summary.total).toBe(4);
      expect(result.summary.completed).toBe(1);
      expect(result.summary.pending).toBe(1);
      expect(result.summary.applied).toBe(1);
      expect(result.summary.expired).toBe(1);
      expect(result.summary.totalEarned).toBe(500);
    });

    it('returns zero totalEarned when no completed referrals', async () => {
      mockPrisma.referral.findMany.mockResolvedValue([
        makeMockReferral({ status: 'PENDING', reward: null }),
      ]);

      const result = await service.getMyReferrals('user-uuid-1');
      expect(result.summary.totalEarned).toBe(0);
    });
  });

  // ── getLeaderboard ────────────────────────────────────────────────────────

  describe('getLeaderboard', () => {
    it('returns empty array when no completed referrals', async () => {
      mockPrisma.referral.groupBy.mockResolvedValue([]);

      const result = await service.getLeaderboard({ period: LeaderboardPeriod.ALL_TIME, limit: 10 });
      expect(result).toEqual([]);
    });

    it('ranks users by completedReferrals count', async () => {
      mockPrisma.referral.groupBy.mockResolvedValue([
        { referrerId: 'user-a', _count: { id: 5 } },
        { referrerId: 'user-b', _count: { id: 3 } },
      ]);
      mockPrisma.user.findMany.mockResolvedValue([
        { id: 'user-a', firstName: 'Abel',  lastName: 'T', avatarUrl: null },
        { id: 'user-b', firstName: 'Biruk', lastName: 'G', avatarUrl: null },
      ]);

      const result = await service.getLeaderboard({ period: LeaderboardPeriod.ALL_TIME, limit: 10 });

      expect(result[0].rank).toBe(1);
      expect(result[0].completedReferrals).toBe(5);
      expect(result[0].name).toBe('Abel T');
      expect(result[1].rank).toBe(2);
    });

    it('filters by week period — passes since date to groupBy', async () => {
      mockPrisma.referral.groupBy.mockResolvedValue([]);

      await service.getLeaderboard({ period: LeaderboardPeriod.WEEK, limit: 5 });

      const call = mockPrisma.referral.groupBy.mock.calls[0][0];
      expect(call.where.completedAt).toBeDefined();
      expect(call.where.completedAt.gte).toBeInstanceOf(Date);
    });

    it('does NOT pass a date filter for all-time period', async () => {
      mockPrisma.referral.groupBy.mockResolvedValue([]);

      await service.getLeaderboard({ period: LeaderboardPeriod.ALL_TIME, limit: 5 });

      const call = mockPrisma.referral.groupBy.mock.calls[0][0];
      expect(call.where.completedAt).toBeUndefined();
    });
  });

  // ── expireStaleReferrals ──────────────────────────────────────────────────

  describe('expireStaleReferrals', () => {
    it('returns count of expired referrals', async () => {
      mockPrisma.referral.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.expireStaleReferrals();
      expect(result.expired).toBe(3);
    });

    it('returns 0 when nothing to expire', async () => {
      mockPrisma.referral.updateMany.mockResolvedValue({ count: 0 });

      const result = await service.expireStaleReferrals();
      expect(result.expired).toBe(0);
    });

    it('calls updateMany with correct where clause', async () => {
      mockPrisma.referral.updateMany.mockResolvedValue({ count: 0 });

      await service.expireStaleReferrals();

      const call = mockPrisma.referral.updateMany.mock.calls[0][0];
      expect(call.where.status).toEqual({ in: ['PENDING'] });
      expect(call.where.expiresAt.lt).toBeInstanceOf(Date);
      expect(call.data.status).toBe('EXPIRED');
    });
  });

  // ── onApplicationOffered (event listener) ────────────────────────────────

  describe('onApplicationOffered', () => {
    it('does nothing when no APPLIED referral exists for the user', async () => {
      mockPrisma.referral.findFirst.mockResolvedValue(null);

      await service.onApplicationOffered({ userId: 'user-uuid-2', applicationId: 'app-1' });

      expect(mockReferralsQueue.add).not.toHaveBeenCalled();
    });

    it('queues REWARD_REFERRER when an APPLIED referral is found', async () => {
      mockPrisma.referral.findFirst.mockResolvedValue(
        makeMockReferral({ status: 'APPLIED', referredUserId: 'user-uuid-2' }),
      );
      mockReferralsQueue.add.mockResolvedValue({});

      await service.onApplicationOffered({ userId: 'user-uuid-2', applicationId: 'app-1' });

      expect(mockReferralsQueue.add).toHaveBeenCalledWith(
        'reward-referrer',
        expect.objectContaining({
          referralId:     'referral-uuid-1',
          referrerId:     'user-uuid-1',
          referredUserId: 'user-uuid-2',
          amount:         REFERRAL_CONFIG.REWARD_AMOUNT,
        }),
        expect.objectContaining({ jobId: 'reward:referral-uuid-1' }),
      );
    });
  });
});
