// users.controller.ts
import { Controller, Get, Patch, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, CurrentUserPayload } from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { UpdateUserDto, CreateCompanyDto } from './dto/update-user.dto';
import { UpsertCvDto } from './dto/upsert-cv.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly svc: UsersService) {}

  @Get('profile')
  profile(@CurrentUser() u: CurrentUserPayload) { return this.svc.findById(u.userId); }

  @Patch('profile')
  update(@CurrentUser() u: CurrentUserPayload, @Body() dto: UpdateUserDto) { return this.svc.update(u.userId, dto); }

  @Get('cv')
  getCv(@CurrentUser() u: CurrentUserPayload) { return this.svc.getCv(u.userId); }

  @Put('cv')
  upsertCv(@CurrentUser() u: CurrentUserPayload, @Body() dto: UpsertCvDto) {
    return this.svc.upsertCv(u.userId, dto.cvData);
  }

  @Get('company')
  getCompany(@CurrentUser() u: CurrentUserPayload) { return this.svc.getCompany(u.userId); }

  @Post('company')
  createCompany(@CurrentUser() u: CurrentUserPayload, @Body() dto: CreateCompanyDto) { return this.svc.createCompany(u.userId, dto); }

  @Get('notifications')
  notifications(@CurrentUser() u: CurrentUserPayload) { return this.svc.getNotifications(u.userId); }

  @Patch('notifications/:id/read')
  markRead(@Param('id') id: string, @CurrentUser() u: CurrentUserPayload) { return this.svc.markNotificationRead(id, u.userId); }
}
