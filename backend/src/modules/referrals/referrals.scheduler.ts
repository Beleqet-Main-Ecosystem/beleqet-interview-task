// =============================================================================
// Beleqet — ReferralsScheduler
//
// Runs a daily BullMQ job that sweeps PENDING referrals past their expiresAt
// date and marks them EXPIRED. Uses a Redis lock to ensure only one scheduler
// runs at a time even in a multi-instance deployment.
// =============================================================================

import { Injectable, Logger, OnApplicationBootstrap, Inject } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import type { Redis } from 'ioredis';
import { QUEUE_NAMES, REFERRAL_JOBS } from '../queues/queues.constants';
import { REFERRALS_REDIS } from './referrals.service';

/** How often (ms) the scheduler fires. Default: once every 24 hours. */
const SWEEP_INTERVAL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class ReferralsScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(ReferralsScheduler.name);
  private timer: NodeJS.Timeout | null = null;

  constructor(
    @InjectQueue(QUEUE_NAMES.REFERRALS) private readonly referralsQueue: Queue,
    @Inject(REFERRALS_REDIS) private readonly redis: Redis,
  ) {}

  onApplicationBootstrap() {
    // Queue a first run shortly after startup, then repeat
    this.timer = setTimeout(() => this.triggerSweep(), 5_000);
    this.logger.log('Referral expiry scheduler initialised — first sweep in 5s');
  }

  private scheduleNext() {
    this.timer = setTimeout(() => this.triggerSweep(), SWEEP_INTERVAL_MS);
  }

  /**
   * Uses a Redis NX lock so that in a multi-replica setup only one pod
   * enqueues the sweep job at a time.
   */
  private async triggerSweep() {
    const lockKey = 'referral:scheduler:lock';
    const acquired = await this.redis.set(
      lockKey,
      process.pid.toString(),
      'EX',
      60, // 1-minute lock; if the pod crashes, another will take over after 60s
      'NX',
    );

    if (acquired) {
      try {
        await this.referralsQueue.add(
          REFERRAL_JOBS.EXPIRE_REFERRALS,
          {},
          {
            attempts:         2,
            backoff:          { type: 'fixed', delay: 10_000 },
            removeOnComplete: 10,
            removeOnFail:     20,
          },
        );
        this.logger.log('Referral expiry sweep enqueued');
      } catch (err) {
        this.logger.error('Failed to enqueue expiry sweep', (err as Error).message);
      }
    } else {
      this.logger.debug('Expiry sweep already enqueued by another instance — skipping');
    }

    this.scheduleNext();
  }
}
