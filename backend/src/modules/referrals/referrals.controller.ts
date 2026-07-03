// =============================================================================
// Beleqet — ReferralsController
//
// Routes:
//   POST   /referrals/generate      → authenticated; generate / return the caller's
//                                     referral code
//   POST   /referrals/apply         → authenticated; apply a code for the calling
//                                     user (typically called right after register)
//   GET    /referrals/mine          → authenticated; list all of the caller's
//                                     referrals + summary stats
//   GET    /referrals/leaderboard   → public; ranked list of top referrers
// =============================================================================

import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';

import { ReferralsService } from './referrals.service';
import { ApplyReferralDto, LeaderboardQueryDto, LeaderboardPeriod } from './dto/referral.dto';

// ── Minimal request type pulled from JWT strategy ─────────────────────────

interface JwtRequest {
  user: { sub: string; email: string; role: string };
}

@ApiTags('Referrals')
@Controller('referrals')
@UseGuards(ThrottlerGuard)
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  // ── POST /referrals/generate ────────────────────────────────────────────

  @Post('generate')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate (or return existing) referral link',
    description:
      'Returns the authenticated user\'s active referral code and a pre-built registration link. ' +
      'Idempotent — calling multiple times returns the same code until it expires.',
  })
  @ApiResponse({
    status: 200,
    description: 'Referral code and link',
    schema: {
      example: {
        code:      'REF-A3B9C2D1',
        link:      'https://beleqet.com/auth/register?ref=REF-A3B9C2D1',
        expiresAt: '2026-10-01T00:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Max active referrals reached' })
  @ApiResponse({ status: 409, description: 'Concurrent generation in progress — retry' })
  async generate(@Request() req: JwtRequest) {
    return this.referralsService.generateLink(req.user.sub);
  }

  // ── POST /referrals/apply ───────────────────────────────────────────────

  @Post('apply')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Apply a referral code',
    description:
      'Claims a referral code on behalf of the authenticated user. Call this once, right ' +
      'after registration. Fully idempotent — retrying the same code returns a success ' +
      'response without side effects.',
  })
  @ApiResponse({ status: 200, description: 'Referral code applied and reward pipeline started' })
  @ApiResponse({ status: 400, description: 'Code invalid, expired, or self-referral attempt' })
  @ApiResponse({ status: 404, description: 'Referral code not found' })
  @ApiResponse({ status: 409, description: 'You have already applied a referral code' })
  async apply(@Request() req: JwtRequest, @Body() dto: ApplyReferralDto) {
    return this.referralsService.applyReferral(req.user.sub, dto);
  }

  // ── GET /referrals/mine ─────────────────────────────────────────────────

  @Get('mine')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get my referrals and earnings summary',
    description:
      'Returns all referrals created by the authenticated user along with a summary ' +
      '(total, pending, applied, completed, expired, totalEarned).',
  })
  @ApiResponse({
    status: 200,
    description: 'Referrals list with summary statistics',
    schema: {
      example: {
        summary: {
          total: 5, pending: 2, applied: 1, completed: 2, expired: 0, totalEarned: 1000,
        },
        referrals: [],
      },
    },
  })
  async getMyReferrals(@Request() req: JwtRequest) {
    return this.referralsService.getMyReferrals(req.user.sub);
  }

  // ── GET /referrals/leaderboard ──────────────────────────────────────────

  @Get('leaderboard')
  @ApiOperation({
    summary: 'Top referrers leaderboard',
    description: 'Public endpoint. Returns ranked users by number of completed referrals.',
  })
  @ApiQuery({
    name:        'period',
    required:    false,
    enum:        LeaderboardPeriod,
    description: 'Time window: all | month | week',
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Max rows (1-50)' })
  @ApiResponse({
    status: 200,
    description: 'Ranked leaderboard entries',
    schema: {
      example: [
        {
          rank: 1,
          userId: 'uuid',
          name: 'Abel Tesfaye',
          avatarUrl: null,
          completedReferrals: 8,
        },
      ],
    },
  })
  async getLeaderboard(@Query() query: LeaderboardQueryDto) {
    return this.referralsService.getLeaderboard(query);
  }
}
