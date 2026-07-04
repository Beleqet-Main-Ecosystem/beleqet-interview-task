import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto, CreateCompanyDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { 
        id: true, email: true, firstName: true, lastName: true, role: true, 
        avatarUrl: true, phone: true, telegramId: true, createdAt: true, 
        company: true, headline: true, bio: true, location: true, 
        defaultResumeUrl: true, portfolioUrl: true, githubUrl: true, 
        linkedinUrl: true, skills: true, cvData: true
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  private profileSelect = {
    id: true, email: true, firstName: true, lastName: true, role: true,
    avatarUrl: true, phone: true, telegramId: true, createdAt: true,
    company: true, headline: true, bio: true, location: true,
    defaultResumeUrl: true, portfolioUrl: true, githubUrl: true,
    linkedinUrl: true, skills: true, cvData: true,
  } as const;

  async getCv(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: this.profileSelect,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async upsertCv(userId: string, cvData: Record<string, unknown>) {
    const fullName = String(cvData['fullName'] ?? '').trim();
    const parts = fullName.split(/\s+/);
    const firstName = parts[0];
    const lastName = parts.slice(1).join(' ');
    const skillsRaw = cvData['skills'];
    const skills = typeof skillsRaw === 'string'
      ? skillsRaw.split(',').map((s) => s.trim()).filter(Boolean)
      : undefined;

    const patch: UpdateUserDto & { cvData?: object } = { cvData };
    if (firstName) patch.firstName = firstName;
    if (lastName) patch.lastName = lastName;
    if (typeof cvData['phone'] === 'string') patch.phone = cvData['phone'];
    if (typeof cvData['headline'] === 'string') patch.headline = cvData['headline'];
    if (typeof cvData['summary'] === 'string') patch.bio = cvData['summary'];
    if (typeof cvData['location'] === 'string') patch.location = cvData['location'];
    if (skills) patch.skills = skills;

    const url = (v: unknown) => {
      const s = String(v ?? '').trim();
      if (!s) return undefined;
      return s.startsWith('http') ? s : `https://${s}`;
    };
    const linkedin = url(cvData['linkedin']);
    const github = url(cvData['github']);
    const portfolio = url(cvData['portfolio']);
    if (linkedin) patch.linkedinUrl = linkedin;
    if (github) patch.githubUrl = github;
    if (portfolio) patch.portfolioUrl = portfolio;

    return this.prisma.user.update({
      where: { id: userId },
      data: patch as never,
      select: this.profileSelect,
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    return this.prisma.user.update({ 
      where: { id }, 
      data: dto,
      select: this.profileSelect,
    });
  }

  async createCompany(userId: string, dto: CreateCompanyDto) {
    const existing = await this.prisma.company.findUnique({ where: { userId } });
    if (existing) {
      return this.prisma.company.update({
        where: { userId },
        data: {
          name: dto.name,
          description: dto.description,
          location: dto.location,
          industry: dto.industry,
          size: dto.size,
          ...(dto.subscriptionPlan ? { subscriptionPlan: dto.subscriptionPlan } : {}),
        },
      });
    }
    return this.prisma.company.create({
      data: {
        ...dto,
        userId,
        subscriptionPlan: dto.subscriptionPlan ?? 'BASIC',
      },
    });
  }

  async getCompany(userId: string) {
    return this.prisma.company.findUnique({ where: { userId }, include: { jobs: { take: 5, orderBy: { createdAt: 'desc' } } } });
  }

  async getNotifications(userId: string) {
    return this.prisma.notification.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 50 });
  }

  async markNotificationRead(notificationId: string, userId: string) {
    return this.prisma.notification.updateMany({ where: { id: notificationId, userId }, data: { read: true } });
  }
}
