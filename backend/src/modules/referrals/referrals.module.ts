// =============================================================================
// Beleqet — ReferralsModule
//
// Wires together:
//   • ReferralsController    — HTTP endpoints (generate, apply, mine, leaderboard)
//   • ReferralsService       — business logic + EventEmitter listener
//   • ReferralsProcessor     — BullMQ job state-machine
//   • ReferralsScheduler     — daily expiry sweep
//   • REFERRALS_REDIS        — custom ioredis instance for dedup locks
//   • BullModule queues      — REFERRALS + NOTIFICATIONS (for cross-queue dispatch)
// =============================================================================

import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

import { PrismaModule } from '../../prisma/prisma.module';
import { QUEUE_NAMES } from '../queues/queues.constants';

import { ReferralsController } from './referrals.controller';
import { ReferralsService, REFERRALS_REDIS } from './referrals.service';
import { ReferralsProcessor } from './referrals.processor';
import { ReferralsScheduler } from './referrals.scheduler';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,

    // Register this module's own queue
    BullModule.registerQueue({ name: QUEUE_NAMES.REFERRALS }),

    // Inject the NOTIFICATIONS queue so the processor / service can dispatch
    // notifications without importing the full NotificationsModule
    BullModule.registerQueue({ name: QUEUE_NAMES.NOTIFICATIONS }),
  ],

  providers: [
    // ── Custom ioredis client ─────────────────────────────────────────────
    // Shares the same Redis connection parameters as BullMQ but is a dedicated
    // client so we can issue NX locks without interfering with the queue client.
    {
      provide:    REFERRALS_REDIS,
      inject:     [ConfigService],
      useFactory: (config: ConfigService): Redis => {
        const client = new Redis({
          host:            config.get<string>('REDIS_HOST', 'localhost'),
          port:            config.get<number>('REDIS_PORT', 6379),
          password:        config.get<string>('REDIS_PASSWORD') || undefined,
          tls:             config.get<boolean>('REDIS_TLS', false) ? {} : undefined,
          maxRetriesPerRequest: null, // required by BullMQ; also good for a standalone client
          lazyConnect:     true,
        });

        client.on('error', (err) => {
          // Log but don't crash — the queue layer will also report connectivity issues
          console.error('[ReferralsRedis] Connection error:', err.message);
        });

        return client;
      },
    },

    ReferralsService,
    ReferralsProcessor,
    ReferralsScheduler,
  ],

  controllers: [ReferralsController],

  // Export the service so other modules (e.g. AuthModule) can call applyReferral
  exports: [ReferralsService],
})
export class ReferralsModule {}
