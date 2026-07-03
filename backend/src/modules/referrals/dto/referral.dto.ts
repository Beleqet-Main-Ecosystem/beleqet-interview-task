import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  IsEnum,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ── Apply a referral code at registration time ────────────────────────────

export class ApplyReferralDto {
  @ApiProperty({
    description: 'The referral code shared by the existing user',
    example: 'REF-A3B9C2D1',
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 32)
  code: string;
}

// ── Query params for the leaderboard ─────────────────────────────────────

export enum LeaderboardPeriod {
  ALL_TIME = 'all',
  MONTH    = 'month',
  WEEK     = 'week',
}

export class LeaderboardQueryDto {
  @ApiPropertyOptional({
    enum: LeaderboardPeriod,
    description: 'Time window for the leaderboard',
    default: LeaderboardPeriod.ALL_TIME,
  })
  @IsOptional()
  @IsEnum(LeaderboardPeriod)
  period?: LeaderboardPeriod = LeaderboardPeriod.ALL_TIME;

  @ApiPropertyOptional({ description: 'Max rows returned', default: 10, minimum: 1, maximum: 50 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;
}
