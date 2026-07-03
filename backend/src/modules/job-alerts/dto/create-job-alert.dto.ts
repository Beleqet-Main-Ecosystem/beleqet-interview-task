import {
  IsOptional, IsString, IsEnum, IsBoolean,
  MaxLength, MinLength, Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { JobType } from '@prisma/client';
import { ApiProperty } from '@nestjs/swagger';

export class CreateJobAlertDto {
  @ApiProperty({
    required: false,
    description: 'Comma-separated keywords to match in job title/description (max 200 chars)',
    example: 'React, Node.js, TypeScript',
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Keywords must be at least 2 characters' })
  @MaxLength(200, { message: 'Keywords cannot exceed 200 characters' })
  @Transform(({ value }) => (value as string)?.trim())
  keywords?: string;

  @ApiProperty({
    required: false,
    description: 'Job category UUID filter',
    example: '3f6a2e90-c1e2-4d41-8b1f-5e3a9c0d7f12',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'categoryId must be a valid UUID',
  })
  categoryId?: string;

  @ApiProperty({
    required: false,
    description: 'Location filter (city or region)',
    example: 'Addis Ababa',
  })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Location must be at least 2 characters' })
  @MaxLength(100, { message: 'Location cannot exceed 100 characters' })
  @Transform(({ value }) => (value as string)?.trim())
  location?: string;

  @ApiProperty({
    required: false,
    enum: JobType,
    description: 'Job type filter',
    example: JobType.REMOTE,
  })
  @IsOptional()
  @IsEnum(JobType, {
    message: `jobType must be one of: ${Object.values(JobType).join(', ')}`,
  })
  jobType?: JobType;
}

export class UpdateJobAlertDto {
  @ApiProperty({ required: false, description: 'Updated keywords', example: 'Python, Django' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Keywords must be at least 2 characters' })
  @MaxLength(200, { message: 'Keywords cannot exceed 200 characters' })
  @Transform(({ value }) => (value as string)?.trim())
  keywords?: string;

  @ApiProperty({ required: false, description: 'Updated category UUID' })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, {
    message: 'categoryId must be a valid UUID',
  })
  categoryId?: string;

  @ApiProperty({ required: false, description: 'Updated location', example: 'Remote' })
  @IsOptional()
  @IsString()
  @MinLength(2, { message: 'Location must be at least 2 characters' })
  @MaxLength(100, { message: 'Location cannot exceed 100 characters' })
  @Transform(({ value }) => (value as string)?.trim())
  location?: string;

  @ApiProperty({ required: false, enum: JobType, description: 'Updated job type' })
  @IsOptional()
  @IsEnum(JobType, {
    message: `jobType must be one of: ${Object.values(JobType).join(', ')}`,
  })
  jobType?: JobType;

  @ApiProperty({
    required: false,
    description: 'Pause (false) or resume (true) this alert',
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean;
}
