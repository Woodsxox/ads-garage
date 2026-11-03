import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { AuthUser } from '../../common/auth-user.js';
import type { AppConfig } from '../../config/configuration.js';
import { EntitlementsService } from '../entitlements.service.js';
import { BillingEventRecord } from './billing-event.entity.js';
import { BillingProvider, InvalidWebhookSignatureError, type PaidPlanId } from './billing.provider.js';

export type WebhookOutcome = 'applied' | 'duplicate' | 'stale' | 'ignored';

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    private readonly provider: BillingProvider,
    private readonly entitlements: EntitlementsService,
    private readonly config: ConfigService<AppConfig, true>,
    @InjectRepository(BillingEventRecord) private readonly events: Repository<BillingEventRecord>,
  ) {}

  async createCheckout(user: AuthUser, planId: PaidPlanId): Promise<{ url: string }> {
    const current = await this.entitlements.getPlanId(user.id);
    if (current !== 'starter') {
      throw new ConflictException({
        message: 'You already have a paid plan. Use the billing portal to change or cancel it',
        code: 'ALREADY_SUBSCRIBED',
      });
    }
    const subscription = await this.entitlements.getSubscription(user.id);
    const appUrl = this.config.get('appUrl', { infer: true });
    return this.provider.createCheckout({
      userId: user.id,
      email: user.email,
      planId,
      customerId: subscription?.providerCustomerId ?? null,
      successUrl: `${appUrl}/plans?billing=success`,
      cancelUrl: `${appUrl}/plans?billing=cancelled`,
    });
  }

  async createPortal(user: AuthUser): Promise<{ url: string }> {
    const subscription = await this.entitlements.getSubscription(user.id);
    if (!subscription?.providerCustomerId) {
      throw new ConflictException({ message: 'No billing account yet. Start a plan first', code: 'NO_BILLING_ACCOUNT' });
    }
    const appUrl = this.config.get('appUrl', { infer: true });
    return this.provider.createPortal({ customerId: subscription.providerCustomerId, returnUrl: `${appUrl}/plans` });
  }

  /**
   * Verifies and applies a webhook. Safe to call twice with the same event: a redelivery is
   * acknowledged and skipped, and applying the same change again is harmless anyway.
   */
  async handleWebhook(rawBody: Buffer | undefined, signature: string | undefined): Promise<WebhookOutcome> {
    if (!rawBody || !signature) {
      throw new BadRequestException({ message: 'Missing webhook body or signature', code: 'INVALID_WEBHOOK' });
    }

    let event;
    try {
      event = this.provider.parseWebhook(rawBody, signature);
    } catch (error) {
      if (error instanceof InvalidWebhookSignatureError) {
        throw new BadRequestException({ message: 'Invalid webhook signature', code: 'INVALID_SIGNATURE' });
      }
      throw error;
    }

    if (await this.events.existsBy({ id: event.id })) return 'duplicate';

    let outcome: WebhookOutcome = 'ignored';
    if (event.kind === 'subscription') {
      // Prefer the ids we put on the subscription at checkout; fall back to a subscription we already know.
      const known = event.userId ? null : await this.entitlements.findBySubscriptionId(event.subscriptionId);
      const userId = event.userId ?? known?.userId ?? null;
      const planId = event.planId ?? known?.planId ?? null;

      if (!userId || !planId) {
        this.logger.warn(`Subscription event ${event.id} has no user or plan metadata; ignored`);
      } else {
        const applied = await this.entitlements.applySubscription({
          userId,
          planId,
          status: event.status,
          customerId: event.customerId,
          subscriptionId: event.subscriptionId,
          currentPeriodEnd: event.currentPeriodEnd,
          cancelAtPeriodEnd: event.cancelAtPeriodEnd,
          occurredAt: event.occurredAt,
        });
        outcome = applied ? 'applied' : 'stale';
      }
    }

    try {
      await this.events.insert({ id: event.id, type: event.type });
    } catch {
      // A concurrent delivery of the same event recorded it first. Nothing to do.
    }
    return outcome;
  }
}
