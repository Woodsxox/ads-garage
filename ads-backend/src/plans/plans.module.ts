import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import type { AppConfig } from '../config/configuration.js';
import { BillingEventRecord } from './billing/billing-event.entity.js';
import { BillingController } from './billing/billing.controller.js';
import { BillingProvider } from './billing/billing.provider.js';
import { BillingService } from './billing/billing.service.js';
import { StripeBillingProvider, UnconfiguredBillingProvider } from './billing/stripe-billing.provider.js';
import { EntitlementsService } from './entitlements.service.js';
import { PlansController } from './plans.controller.js';
import { PlanGuard } from './require-plan.decorator.js';
import { Subscription } from './subscription.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription, BillingEventRecord])],
  controllers: [PlansController, BillingController],
  providers: [
    EntitlementsService,
    PlanGuard,
    BillingService,
    {
      provide: BillingProvider,
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>): BillingProvider => {
        const stripe = config.get('stripe', { infer: true });
        return stripe.secretKey ? new StripeBillingProvider(stripe) : new UnconfiguredBillingProvider();
      },
    },
  ],
  // Feature modules import this to use `@RequirePlan()` and to read limits.
  exports: [EntitlementsService, PlanGuard],
})
export class PlansModule {}
