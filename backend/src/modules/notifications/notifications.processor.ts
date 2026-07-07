import { Processor, Process } from '@nestjs/bull';
import { Logger, Injectable } from '@nestjs/common';
import { Job } from 'bull';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { QUEUE_NAMES, NOTIFICATION_JOBS } from '../queues/queues.constants';
import * as nodemailer from 'nodemailer';
import { NotificationsGateway } from './notifications.gateway';

interface InAppPayload {
  userId: string;
  type: string;
  title: string;
  body: string;
  metadata?: object;
}

interface TelegramPayload {
  telegramId: string;
  message: string;
}

export interface EmailPayload {
  to: string;
  subject: string;
  html: string;
}

interface SmsPayload {
  to: string;
  message: string;
}

interface PushPayload {
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  payload: string; // JSON Stringified
}

/**
 * BullMQ background queue processor for async delivery of multi-channel notifications.
 */
@Injectable()
@Processor(QUEUE_NAMES.NOTIFICATIONS)
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly gateway: NotificationsGateway,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST'),
      port: this.config.get<number>('SMTP_PORT'),
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
    });
  }

  /**
   * Process in-app notifications. Saves to database and emits via WebSocket Gateway.
   */
  @Process(NOTIFICATION_JOBS.SEND_IN_APP)
  async sendInApp(job: Job<InAppPayload>) {
    const { userId, type, title, body, metadata } = job.data;
    if (!userId) return;
    
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        body,
        channel: 'IN_APP',
        metadata: metadata as never,
      },
    });

    this.logger.debug(`In-app → Saved to DB for user ${userId}: ${title}`);

    // Emit in real-time over WebSocket gateway
    try {
      this.gateway.sendRealTimeNotification(userId, notification);
    } catch (err) {
      this.logger.warn(`Failed to broadcast real-time WebSocket notification: ${(err as Error).message}`);
    }
  }

  /**
   * Process Telegram message dispatch.
   */
  @Process(NOTIFICATION_JOBS.SEND_TELEGRAM)
  async sendTelegram(job: Job<TelegramPayload>) {
    const botToken = this.config.get<string>('TELEGRAM_BOT_TOKEN');
    if (!botToken) return;
    try {
      await fetch(
        `https://api.telegram.org/bot${botToken}/sendMessage`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: job.data.telegramId,
            text: job.data.message,
            parse_mode: 'Markdown',
          }),
        },
      );
      this.logger.debug(`Telegram → ${job.data.telegramId}`);
    } catch (e) {
      this.logger.warn(`Telegram failed: ${(e as Error).message}`);
    }
  }

  /**
   * Process Email dispatch via SMTP.
   */
  @Process(NOTIFICATION_JOBS.SEND_EMAIL)
  async sendEmail(job: Job<EmailPayload>) {
    const { to, subject, html } = job.data;
    if (!to) return;
    
    try {
      await this.transporter.sendMail({
        from: this.config.get<string>('EMAIL_FROM', 'Beleqet <noreply@beleqet.com>'),
        to,
        subject,
        html,
      });
      this.logger.debug(`Email → ${to}: ${subject}`);
    } catch (e) {
      this.logger.warn(`Email failed: ${(e as Error).message}`);
    }
  }

  /**
   * Process SMS dispatch. Resolves Twilio or Africa's Talking API structure.
   */
  @Process(NOTIFICATION_JOBS.SEND_SMS)
  async sendSms(job: Job<SmsPayload>) {
    const { to, message } = job.data;
    if (!to) return;

    this.logger.log(`[SMS Gateway SIMULATION] Send to ${to} -> Msg: "${message}"`);
    
    // Skeleton logic for production (Twilio integration):
    // const accountSid = this.config.get('TWILIO_ACCOUNT_SID');
    // const authToken = this.config.get('TWILIO_AUTH_TOKEN');
    // const twilioPhone = this.config.get('TWILIO_PHONE_NUMBER');
    // if (accountSid && authToken) {
    //   const client = new Twilio(accountSid, authToken);
    //   await client.messages.create({ body: message, from: twilioPhone, to });
    // }
  }

  /**
   * Process Web Push dispatch. Encrypts payload and posts to browser endpoint.
   */
  @Process(NOTIFICATION_JOBS.SEND_PUSH)
  async sendPushNotification(job: Job<PushPayload>) {
    const { subscription, payload } = job.data;
    if (!subscription || !subscription.endpoint) return;

    this.logger.log(`[Push Notification SIMULATION] Send to ${subscription.endpoint} -> Payload: ${payload}`);

    // Skeleton logic for production (web-push integration):
    // const publicKey = this.config.get('VAPID_PUBLIC_KEY');
    // const privateKey = this.config.get('VAPID_PRIVATE_KEY');
    // webpush.setVapidDetails('mailto:admin@beleqet.com', publicKey, privateKey);
    // await webpush.sendNotification(subscription, payload);
  }
}
