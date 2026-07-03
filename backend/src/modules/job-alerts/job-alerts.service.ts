import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CreateJobAlertDto, UpdateJobAlertDto } from './dto/create-job-alert.dto';
import { QUEUE_NAMES, ALERT_JOBS } from '../queues/queues.constants';

@Injectable()
export class JobAlertsService {
  private readonly logger = new Logger(JobAlertsService.name);

  constructor(
    private readonly prisma: PrismaService,
    @InjectQueue(QUEUE_NAMES.ALERTS) private readonly alertsQueue: Queue,
  ) {}

  /** Create a new job alert subscription for the authenticated user */
  async create(userId: string, dto: CreateJobAlertDto) {
    // Validation: at least one filter must be provided
    if (!dto.keywords && !dto.categoryId && !dto.location && !dto.jobType) {
      throw new BadRequestException(
        'At least one filter (keywords, categoryId, location, or jobType) is required',
      );
    }

    // Validate user exists and is active
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, isActive: true, email: true },
    });

    if (!user || !user.isActive) {
      throw new BadRequestException('User account is not active');
    }

    // Check user doesn't exceed max alerts (prevent abuse)
    const alertCount = await this.prisma.jobAlert.count({ where: { userId } });
    const MAX_ALERTS_PER_USER = 10;
    if (alertCount >= MAX_ALERTS_PER_USER) {
      throw new BadRequestException(
        `Maximum of ${MAX_ALERTS_PER_USER} job alerts per user. Delete an existing alert to create a new one.`,
      );
    }

    // Validate categoryId if provided
    if (dto.categoryId) {
      const category = await this.prisma.jobCategory.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(`Job category ${dto.categoryId} not found`);
      }
    }

    try {
      const alert = await this.prisma.jobAlert.create({
        data: {
          userId,
          keywords:   dto.keywords?.trim() ?? null,
          categoryId: dto.categoryId ?? null,
          location:   dto.location?.trim() ?? null,
          jobType:    dto.jobType ?? null,
          isActive:   true,
        },
        include: { category: true, user: { select: { email: true } } },
      });

      this.logger.log(`Job alert ${alert.id} created for user ${userId} (${user.email})`);
      return alert;
    } catch (error) {
      this.logger.error(`Failed to create job alert for user ${userId}:`, error);
      throw new BadRequestException('Failed to create job alert. Please try again.');
    }
  }

  /** Return all alerts for the authenticated user */
  async findAll(userId: string) {
    return this.prisma.jobAlert.findMany({
      where:   { userId },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  /** Return a single alert (must belong to the requesting user) */
  async findOne(id: string, userId: string) {
    const alert = await this.prisma.jobAlert.findFirst({
      where:   { id, userId },
      include: { category: true },
    });
    if (!alert) throw new NotFoundException(`Job alert ${id} not found`);
    return alert;
  }

  /** Update alert filters or toggle isActive */
  async update(id: string, userId: string, dto: UpdateJobAlertDto) {
    await this.findOne(id, userId); // ownership check

    if (dto.categoryId) {
      const category = await this.prisma.jobCategory.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(`Job category ${dto.categoryId} not found`);
      }
    }

    return this.prisma.jobAlert.update({
      where: { id },
      data: {
        ...(dto.keywords   !== undefined && { keywords:   dto.keywords.trim() }),
        ...(dto.categoryId !== undefined && { categoryId: dto.categoryId }),
        ...(dto.location   !== undefined && { location:   dto.location.trim() }),
        ...(dto.jobType    !== undefined && { jobType:    dto.jobType }),
        ...(dto.isActive   !== undefined && { isActive:   dto.isActive }),
      },
      include: { category: true },
    });
  }

  /** Delete an alert */
  async remove(id: string, userId: string) {
    await this.findOne(id, userId); // ownership check
    await this.prisma.jobAlert.delete({ where: { id } });
    return { message: 'Job alert deleted successfully' };
  }

  /**
   * Triggered by the scheduler — dispatches one BullMQ job per active alert
   * that hasn't been sent in the past 23 hours (prevents duplicate sends if
   * the cron runs slightly early or late).
   */
  async dispatchAlerts() {
    const since = new Date(Date.now() - 23 * 60 * 60 * 1000);
    const alerts = await this.prisma.jobAlert.findMany({
      where: {
        isActive:   true,
        OR: [
          { lastSentAt: null },
          { lastSentAt: { lt: since } },
        ],
      },
      include: { user: { select: { id: true, email: true, firstName: true } } },
    });

    this.logger.log(`Dispatching ${alerts.length} job alert(s)`);

    for (const alert of alerts) {
      await this.alertsQueue.add(
        ALERT_JOBS.SEND_ALERT_EMAIL,
        { alertId: alert.id },
        {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5_000 },
          removeOnComplete: 50,
          removeOnFail: 100,
        },
      );
    }

    return { dispatched: alerts.length };
  }

  /**
   * Core matching logic: find jobs created in the last 24 hours that match
   * the alert's filters. Used by the processor.
   */
  async findMatchingJobs(alertId: string) {
    const alert = await this.prisma.jobAlert.findUnique({
      where: { id: alertId },
    });
    if (!alert) throw new NotFoundException(`Alert ${alertId} not found`);

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const where: Prisma.JobWhereInput = {
      status:    'PUBLISHED',
      createdAt: { gte: since },
      ...(alert.categoryId && { categoryId: alert.categoryId }),
      ...(alert.location   && {
        location: { contains: alert.location, mode: 'insensitive' },
      }),
      ...(alert.jobType && { type: alert.jobType }),
      ...(alert.keywords && {
        OR: alert.keywords.split(',').map(kw => kw.trim()).filter(Boolean).flatMap(kw => [
          { title:       { contains: kw, mode: 'insensitive' as const } },
          { description: { contains: kw, mode: 'insensitive' as const } },
        ]),
      }),
    };

    return this.prisma.job.findMany({
      where,
      include: { company: { select: { name: true, logoUrl: true } }, category: true },
      take: 10, // cap at 10 per email to keep it readable
      orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
    });
  }

  /** Mark alert as sent after email is delivered */
  async markSent(alertId: string) {
    await this.prisma.jobAlert.update({
      where: { id: alertId },
      data:  { lastSentAt: new Date() },
    });
  }
}
