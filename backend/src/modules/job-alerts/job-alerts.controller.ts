import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JobAlertsService } from './job-alerts.service';
import { CreateJobAlertDto, UpdateJobAlertDto } from './dto/create-job-alert.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Job Alerts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('job-alerts')
export class JobAlertsController {
  constructor(private readonly service: JobAlertsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new job alert subscription' })
  @ApiResponse({ status: 201, description: 'Alert created successfully' })
  @ApiResponse({ status: 400, description: 'At least one filter is required' })
  create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateJobAlertDto,
  ) {
    return this.service.create(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all job alerts for the current user' })
  findAll(@CurrentUser('id') userId: string) {
    return this.service.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single job alert' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.findOne(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update filters or pause/resume an alert' })
  update(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateJobAlertDto,
  ) {
    return this.service.update(id, userId, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a job alert' })
  remove(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.remove(id, userId);
  }

  /**
   * Admin / cron-style endpoint to manually trigger alert dispatch.
   * In production this would be called by a scheduler (e.g. cron), but
   * exposing it here makes it testable without a cron daemon.
   */
  @Post('admin/dispatch')
  @ApiOperation({ summary: '[Admin] Manually dispatch all pending job alerts' })
  dispatch() {
    return this.service.dispatchAlerts();
  }
}
