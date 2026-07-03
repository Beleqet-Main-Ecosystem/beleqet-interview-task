import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { JobAlertsService } from './job-alerts.service';
import { QUEUE_NAMES, ALERT_JOBS } from '../queues/queues.constants';
import { PrismaService } from '../../prisma/prisma.service';

interface SendAlertPayload {
  alertId: string;
}

@Processor(QUEUE_NAMES.ALERTS)
export class JobAlertsProcessor {
  private readonly logger = new Logger(JobAlertsProcessor.name);
  private readonly transporter: nodemailer.Transporter;

  constructor(
    private readonly alertsService: JobAlertsService,
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    this.transporter = nodemailer.createTransport({
      host:   this.config.get<string>('SMTP_HOST'),
      port:   this.config.get<number>('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
    });
  }

  @Process(ALERT_JOBS.SEND_ALERT_EMAIL)
  async handleSendAlertEmail(job: Job<SendAlertPayload>) {
    const { alertId } = job.data;
    this.logger.debug(`Processing alert ${alertId}`);

    // 1. Load alert + owner
    const alert = await this.prisma.jobAlert.findUnique({
      where:   { id: alertId },
      include: { user: { select: { id: true, email: true, firstName: true } } },
    });

    if (!alert || !alert.isActive) {
      this.logger.warn(`Alert ${alertId} is inactive or missing — skipping`);
      return;
    }

    // 2. Find matching jobs
    const jobs = await this.alertsService.findMatchingJobs(alertId);

    if (jobs.length === 0) {
      this.logger.debug(`No matching jobs for alert ${alertId} — skipping email`);
      // Still mark as sent so we don't re-check for 24h
      await this.alertsService.markSent(alertId);
      return;
    }

    // 3. Build email HTML
    const filterSummary = [
      alert.keywords && `Keywords: <strong>${alert.keywords}</strong>`,
      alert.location && `Location: <strong>${alert.location}</strong>`,
      alert.jobType  && `Type: <strong>${alert.jobType.replace('_', ' ')}</strong>`,
    ].filter(Boolean).join(' · ') || 'All Jobs';

    const jobRows = jobs.map(j => `
      <tr>
        <td style="padding:12px 0; border-bottom:1px solid #f0f0f0;">
          <a href="http://localhost:3000/jobs/${j.id}" style="font-size:16px; font-weight:600; color:#2563eb; text-decoration:none;">
            ${j.title}
          </a>
          <br/>
          <span style="color:#6b7280; font-size:13px;">
            ${j.company?.name ?? 'Unknown Company'} · ${j.location} · ${j.type.replace('_', ' ')}
          </span>
          ${j.salaryMin ? `<br/><span style="color:#059669; font-size:13px;">ETB ${j.salaryMin.toLocaleString()}${j.salaryMax ? ` – ${j.salaryMax.toLocaleString()}` : '+'}</span>` : ''}
        </td>
      </tr>
    `).join('');

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f9fafb; margin:0; padding:0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px; margin:32px auto; background:#ffffff; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,.1); overflow:hidden;">
    <!-- Header -->
    <tr>
      <td style="background:#2563eb; padding:24px 32px; color:#fff;">
        <h1 style="margin:0; font-size:22px;">🔔 New Job Matches for You</h1>
        <p style="margin:6px 0 0; opacity:.85; font-size:14px;">${filterSummary}</p>
      </td>
    </tr>
    <!-- Greeting -->
    <tr>
      <td style="padding:24px 32px 0;">
        <p style="margin:0; font-size:15px; color:#374151;">
          Hi <strong>${alert.user.firstName}</strong>, here are <strong>${jobs.length}</strong> new job${jobs.length > 1 ? 's' : ''} matching your alert:
        </p>
      </td>
    </tr>
    <!-- Jobs list -->
    <tr>
      <td style="padding:16px 32px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${jobRows}
        </table>
      </td>
    </tr>
    <!-- CTA -->
    <tr>
      <td style="padding:8px 32px 24px; text-align:center;">
        <a href="http://localhost:3000/jobs" style="display:inline-block; background:#2563eb; color:#fff; text-decoration:none; padding:12px 28px; border-radius:8px; font-size:15px; font-weight:600;">
          Browse All Jobs →
        </a>
      </td>
    </tr>
    <!-- Footer -->
    <tr>
      <td style="background:#f9fafb; padding:16px 32px; text-align:center; border-top:1px solid #e5e7eb;">
        <p style="margin:0; font-size:12px; color:#9ca3af;">
          You are receiving this because you set up a job alert on Beleqet.<br/>
          <a href="http://localhost:3000/alerts" style="color:#6b7280;">Manage your alerts</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`;

    // 4. Send email (graceful failure — SMTP may not be configured)
    const smtpHost = this.config.get<string>('SMTP_HOST');
    if (smtpHost && smtpHost !== 'smtp.gmail.com') {
      try {
        await this.transporter.sendMail({
          from:    this.config.get<string>('EMAIL_FROM', 'Beleqet <noreply@beleqet.com>'),
          to:      alert.user.email,
          subject: `🔔 ${jobs.length} new job${jobs.length > 1 ? 's' : ''} matching your alert`,
          html,
        });
        this.logger.log(`Alert email sent to ${alert.user.email} (${jobs.length} jobs)`);
      } catch (err) {
        this.logger.warn(`SMTP send failed for alert ${alertId}: ${(err as Error).message}`);
        throw err; // re-throw so BullMQ retries
      }
    } else {
      // No real SMTP — log instead (safe for Docker dev environment)
      this.logger.log(
        `[DEV] Would send alert email to ${alert.user.email} — ${jobs.length} matching jobs: ` +
        jobs.map(j => j.title).join(', '),
      );
    }

    // 5. Mark alert as sent
    await this.alertsService.markSent(alertId);
  }

  @Process(ALERT_JOBS.DISPATCH_ALERTS)
  async handleDispatchAlerts(_job: Job) {
    this.logger.log('Running scheduled alert dispatch');
    const result = await this.alertsService.dispatchAlerts();
    this.logger.log(`Dispatch complete — ${result.dispatched} alerts queued`);
  }
}
