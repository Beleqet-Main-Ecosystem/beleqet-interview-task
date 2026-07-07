import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { QUEUE_NAMES, NOTIFICATION_JOBS } from '../queues/queues.constants';

export class UpdatePreferencesDto {
  email?: boolean;
  sms?: boolean;
  push?: boolean;
  inApp?: boolean;
}

export class RegisterPushDto {
  endpoint: string;
  p256dh: string;
  auth: string;
}

/**
 * Service managing user notification preferences, web push subscriptions,
 * and routing notifications to their appropriate channels.
 */
@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.NOTIFICATIONS) private readonly queue: Queue,
  ) {}

  /**
   * Send a notification to a specific user.
   * Resolves preferences, checks opt-ins, and routes to appropriate channels via BullMQ.
   */
  async sendNotification(
    userId: string,
    type: string,
    title: string,
    body: string,
    metadata?: Record<string, any>,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { pushSubscriptions: true },
    });
    if (!user) {
      this.logger.warn(`Skipping notification for non-existing user: ${userId}`);
      return;
    }

    // Resolve or create default preferences
    let prefs = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });
    if (!prefs) {
      prefs = await this.prisma.notificationPreference.create({
        data: { userId },
      });
    }

    // ── 1. In-App Routing ──
    if (prefs.inApp) {
      await this.queue.add(NOTIFICATION_JOBS.SEND_IN_APP, {
        userId,
        type,
        title,
        body,
        metadata,
      });
    }

    // ── 2. Email Routing ──
    if (prefs.email && user.email) {
      await this.queue.add(NOTIFICATION_JOBS.SEND_EMAIL, {
        to: user.email,
        subject: title,
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
            <h2>${title}</h2>
            <p>${body}</p>
            <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
            <small style="color: #999;">This is an automated notification from Beleqet. You can update your preferences in your profile settings.</small>
          </div>
        `,
      });
    }

    // ── 3. SMS Routing ──
    if (prefs.sms && user.phone) {
      await this.queue.add(NOTIFICATION_JOBS.SEND_SMS, {
        to: user.phone,
        message: `${title}: ${body}`,
      });
    }

    // ── 4. Web Push Routing ──
    if (prefs.push && user.pushSubscriptions.length > 0) {
      for (const sub of user.pushSubscriptions) {
        await this.queue.add(NOTIFICATION_JOBS.SEND_PUSH, {
          subscription: {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          payload: JSON.stringify({ title, body, metadata }),
        });
      }
    }
  }

  /**
   * Update preferences for a specific user.
   */
  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      update: dto,
      create: { userId, ...dto },
    });
  }

  /**
   * Get current preferences for a user.
   */
  async getPreferences(userId: string) {
    let prefs = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });
    if (!prefs) {
      prefs = await this.prisma.notificationPreference.create({
        data: { userId },
      });
    }
    return prefs;
  }

  /**
   * Register a new web push subscription token.
   */
  async registerPushToken(userId: string, dto: RegisterPushDto) {
    return this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      update: {
        userId,
        p256dh: dto.p256dh,
        auth: dto.auth,
      },
      create: {
        userId,
        endpoint: dto.endpoint,
        p256dh: dto.p256dh,
        auth: dto.auth,
      },
    });
  }
}
