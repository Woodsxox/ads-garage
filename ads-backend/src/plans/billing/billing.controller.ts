import { Body, Controller, Headers, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { IsIn } from 'class-validator';
import type { Request } from 'express';
import type { AuthUser } from '../../common/auth-user.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { BillingService, type WebhookOutcome } from './billing.service.js';

export class CheckoutDto {
  @IsIn(['pro', 'ultra'])
  plan: 'pro' | 'ultra';
}

@ApiTags('billing')
@Controller('billing')
export class BillingController {
  constructor(private readonly billing: BillingService) {}

  /** Starts a hosted checkout and returns the URL to send the browser to. Nothing is unlocked until the webhook arrives. */
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Post('checkout')
  checkout(@CurrentUser() user: AuthUser, @Body() dto: CheckoutDto): Promise<{ url: string }> {
    return this.billing.createCheckout(user, dto.plan);
  }

  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Post('portal')
  portal(@CurrentUser() user: AuthUser): Promise<{ url: string }> {
    return this.billing.createPortal(user);
  }

  /** Called by the payment provider, not the browser. Authenticated by signature, not by token. */
  @Public()
  @SkipThrottle()
  @HttpCode(HttpStatus.OK)
  @Post('webhook')
  async webhook(
    @Req() request: Request & { rawBody?: Buffer },
    @Headers('stripe-signature') signature: string | undefined,
  ): Promise<{ received: true; outcome: WebhookOutcome }> {
    const outcome = await this.billing.handleWebhook(request.rawBody, signature);
    return { received: true, outcome };
  }
}
