import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { AuthUser } from '../common/auth-user.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { AiService, type CopyResult, type UsageSummary } from './ai.service.js';
import { GenerateCopyDto } from './dto/ai.dto.js';

@ApiTags('ai')
@ApiBearerAuth()
@Controller('ai')
export class AiController {
  constructor(private readonly ai: AiService) {}

  /** Models and whether your plan can use each. */
  @Get('models')
  models(@CurrentUser() user: AuthUser) {
    return this.ai.listModels(user.id);
  }

  /** Credits used and left this month. */
  @Get('usage')
  usage(@CurrentUser() user: AuthUser): Promise<UsageSummary> {
    return this.ai.getUsage(user.id);
  }

  /** Generates headline, body and button text variations. Costs credits; refunded if the provider fails. */
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post('copy')
  copy(@CurrentUser() user: AuthUser, @Body() dto: GenerateCopyDto): Promise<CopyResult> {
    return this.ai.generateCopy(user.id, dto);
  }
}
