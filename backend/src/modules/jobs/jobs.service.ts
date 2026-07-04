import { Injectable, NotFoundException, ForbiddenException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateJobDto, QueryJobsDto } from './dto/create-job.dto';

@Injectable()
export class JobsService {
  private readonly planLimits: Record<string, number> = {
    BASIC: 1,
    FEATURED: 5,
    ENTERPRISE: 9999,
  };

  constructor(private readonly prisma: PrismaService) {}

  async create(employerId: string, dto: CreateJobDto) {
    const company = await this.prisma.company.findUnique({ where: { userId: employerId } });
    if (!company) throw new ForbiddenException('Create a company profile before posting jobs');

    const publishedCount = await this.prisma.job.count({
      where: { companyId: company.id, status: 'PUBLISHED' },
    });
    const limit = this.planLimits[company.subscriptionPlan] ?? 1;
    if (publishedCount >= limit) {
      throw new ForbiddenException(
        `Your ${company.subscriptionPlan} plan allows up to ${limit} active job(s). Upgrade your plan to post more.`,
      );
    }

    const data: Record<string, unknown> = { ...dto, companyId: company.id, status: dto.status || 'PUBLISHED' };
    if (company.subscriptionPlan === 'BASIC') {
      data.featured = false;
    } else if (dto.featured && company.subscriptionPlan !== 'FEATURED' && company.subscriptionPlan !== 'ENTERPRISE') {
      data.featured = false;
    }
    if (data.deadline) data.deadline = new Date(data.deadline as string);
    if (data.expiryDate) data.expiryDate = new Date(data.expiryDate as string);

    return this.prisma.job.create({
      data: data as never,
      include: { company: true, category: true },
    });
  }

  async getCategories() {
    return this.prisma.jobCategory.findMany({
      orderBy: { label: 'asc' },
      include: { _count: { select: { jobs: true } } },
    });
  }

  async getStats() {
    const [jobs, companies, seekers] = await Promise.all([
      this.prisma.job.count({ where: { status: 'PUBLISHED' } }),
      this.prisma.company.count(),
      this.prisma.user.count({ where: { role: 'JOB_SEEKER' } }),
    ]);
    return { jobs, companies, seekers };
  }

  async findAll(query: QueryJobsDto) {
    const pageNum = Number(query.page) || 1;
    const limitNum = Number(query.limit) || 20;
    const { q, category, location, type } = query;

    // Build a plain where object without Prisma namespace types
    // (avoids Prisma.JobWhereInput which requires generated client)
    const where: Record<string, unknown> = { status: 'PUBLISHED' };
    if (type)     where['type']     = type;
    if (category) where['category'] = { slug: category };
    if (location) where['location'] = { contains: location, mode: 'insensitive' };
    if (q)        where['OR']       = [
      { title:       { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ];

    const [items, total] = await Promise.all([
      this.prisma.job.findMany({
        where: where as never,
        include: { company: true, category: true, _count: { select: { applications: true } } },
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      }),
      this.prisma.job.count({ where: where as never }),
    ]);

    return { items, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  }

  async findOne(id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: { company: true, category: true, _count: { select: { applications: true } } },
    });
    if (!job) throw new NotFoundException(`Job ${id} not found`);
    return job;
  }

  async update(id: string, employerId: string, dto: Partial<CreateJobDto>) {
    const job = await this.prisma.job.findFirst({ where: { id, company: { userId: employerId } } });
    if (!job) throw new NotFoundException('Job not found or access denied');
    return this.prisma.job.update({ where: { id }, data: dto as never });
  }

  async remove(id: string, employerId: string) {
    const job = await this.prisma.job.findFirst({ where: { id, company: { userId: employerId } } });
    if (!job) throw new NotFoundException('Job not found or access denied');
    return this.prisma.job.update({ where: { id }, data: { status: 'ARCHIVED' } });
  }

  async findByCompany(employerId: string) {
    return this.prisma.job.findMany({
      where: { company: { userId: employerId } },
      include: { category: true, _count: { select: { applications: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSavedJobs(userId: string) {
    const rows = await this.prisma.savedJob.findMany({
      where: { userId },
      include: {
        job: { include: { company: true, category: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((r) => r.job).filter(Boolean);
  }

  async saveJob(userId: string, jobId: string) {
    const job = await this.prisma.job.findFirst({ where: { id: jobId, status: 'PUBLISHED' } });
    if (!job) throw new NotFoundException('Job not found');

    const existing = await this.prisma.savedJob.findUnique({
      where: { userId_jobId: { userId, jobId } },
    });
    if (existing) throw new ConflictException('Job already saved');

    await this.prisma.savedJob.create({ data: { userId, jobId } });
    return { saved: true, jobId };
  }

  async unsaveJob(userId: string, jobId: string) {
    await this.prisma.savedJob.deleteMany({ where: { userId, jobId } });
    return { saved: false, jobId };
  }

  async isJobSaved(userId: string, jobId: string) {
    const row = await this.prisma.savedJob.findUnique({
      where: { userId_jobId: { userId, jobId } },
    });
    return { saved: !!row };
  }
}
