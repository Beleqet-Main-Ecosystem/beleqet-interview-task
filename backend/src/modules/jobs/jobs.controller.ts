import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { JobsService } from './jobs.service';
import { CreateJobDto, QueryJobsDto } from './dto/create-job.dto';

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly svc: JobsService) {}

  @Get()
  @ApiOperation({ summary: 'Search & browse job listings (public)' })
  findAll(@Query() query: QueryJobsDto) {
    return this.svc.findAll(query);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLOYER', 'ADMIN')
  @ApiBearerAuth()
  myJobs(@CurrentUser() user: CurrentUserPayload) {
    return this.svc.findByCompany(user.userId);
  }

  @Get('categories')
  @ApiOperation({ summary: 'Get all job categories' })
  getCategories() {
    return this.svc.getCategories();
  }

  @Get('saved')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List saved jobs for the current user' })
  savedJobs(@CurrentUser() user: CurrentUserPayload) {
    return this.svc.getSavedJobs(user.userId);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Platform stats for homepage (public)' })
  getStats() {
    return this.svc.getStats();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.svc.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLOYER', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a job listing (employer only)' })
  create(@CurrentUser() user: CurrentUserPayload, @Body() dto: CreateJobDto) {
    return this.svc.create(user.userId, dto);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLOYER', 'ADMIN')
  @ApiBearerAuth()
  update(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload, @Body() dto: Partial<CreateJobDto>) {
    return this.svc.update(id, user.userId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('EMPLOYER', 'ADMIN')
  @ApiBearerAuth()
  remove(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.svc.remove(id, user.userId);
  }

  @Post(':id/save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save a job to your bookmarks' })
  saveJob(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.svc.saveJob(user.userId, id);
  }

  @Delete(':id/save')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove a saved job' })
  unsaveJob(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.svc.unsaveJob(user.userId, id);
  }

  @Get(':id/saved')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if a job is saved by the current user' })
  isSaved(@Param('id') id: string, @CurrentUser() user: CurrentUserPayload) {
    return this.svc.isJobSaved(user.userId, id);
  }
}
