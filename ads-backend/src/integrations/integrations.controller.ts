import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, ParseEnumPipe, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../common/auth-user.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { RequirePlan } from '../plans/require-plan.decorator.js';
import { CreateCampaignDto } from './dto/integrations.dto.js';
import { type AccountView, type CampaignView, IntegrationsService } from './integrations.service.js';
import { type Platform, type PlatformId } from './platforms.js';

enum PlatformParam {
  GoogleAds = 'google-ads',
  YouTube = 'youtube',
  TikTok = 'tiktok',
  Meta = 'meta',
}

@ApiTags('integrations')
@ApiBearerAuth()
@Controller('integrations')
export class IntegrationsController {
  constructor(private readonly integrations: IntegrationsService) {}

  /** The platforms and their creative requirements. Placeholder specs until verified against each platform. */
  @Get('platforms')
  platforms(): readonly Platform[] {
    return this.integrations.listPlatforms();
  }

  @Get('accounts')
  accounts(@CurrentUser() user: AuthUser): Promise<AccountView[]> {
    return this.integrations.listAccounts(user.id);
  }

  @RequirePlan('pro')
  @HttpCode(HttpStatus.OK)
  @Post('accounts/:platformId/connect')
  connect(@CurrentUser() user: AuthUser, @Param('platformId', new ParseEnumPipe(PlatformParam)) platformId: PlatformId): Promise<AccountView> {
    return this.integrations.connect(user.id, platformId);
  }

  @Delete('accounts/:platformId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async disconnect(@CurrentUser() user: AuthUser, @Param('platformId', new ParseEnumPipe(PlatformParam)) platformId: PlatformId): Promise<void> {
    await this.integrations.disconnect(user.id, platformId);
  }

  @Get('campaigns')
  campaigns(@CurrentUser() user: AuthUser): Promise<CampaignView[]> {
    return this.integrations.listCampaigns(user.id);
  }

  @RequirePlan('pro')
  @Post('campaigns')
  submit(@CurrentUser() user: AuthUser, @Body() dto: CreateCampaignDto): Promise<CampaignView> {
    return this.integrations.submitCampaign(user.id, dto);
  }
}
