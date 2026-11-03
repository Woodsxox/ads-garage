import { NotImplementedException, ServiceUnavailableException } from '@nestjs/common';
import Stripe from 'stripe';
import type { AppConfig } from '../../config/configuration.js';
import type { SubscriptionStatus } from '../subscription.entity.js';
import {
  BillingProvider,
  type BillingWebhookEvent,
  InvalidWebhookSignatureError,
  type PaidPlanId,
} from './billing.provider.js';

const STATUS_MAP: Record<string, SubscriptionStatus> = {
  active: 'active',
  trialing: 'trialing',
  past_due: 'past_due',
  unpaid: 'unpaid',
  canceled: 'canceled',
  incomplete: 'incomplete',
  incomplete_expired: 'canceled',
  paused: 'paused',
};

/** Used when Stripe is not configured. The API still boots; billing endpoints answer 503. */
export class UnconfiguredBillingProvider extends BillingProvider {
  readonly enabled = false;

  createCheckout(): never {
    throw new ServiceUnavailableException({ message: 'Billing is not configured', code: 'BILLING_NOT_CONFIGURED' });
  }
  createPortal(): never {
    throw new ServiceUnavailableException({ message: 'Billing is not configured', code: 'BILLING_NOT_CONFIGURED' });
  }
  parseWebhook(): never {
    throw new ServiceUnavailableException({ message: 'Billing is not configured', code: 'BILLING_NOT_CONFIGURED' });
  }
}

export class StripeBillingProvider extends BillingProvider {
  readonly enabled = true;
  private readonly stripe: Stripe;
  private readonly webhookSecret: string;
  private readonly prices: AppConfig['stripe']['priceByPlan'];

  constructor(config: AppConfig['stripe']) {
    super();
    if (!config.secretKey || !config.webhookSecret) throw new Error('Stripe is not fully configured');
    this.stripe = new Stripe(config.secretKey);
    this.webhookSecret = config.webhookSecret;
    this.prices = config.priceByPlan;
  }

  async createCheckout(input: Parameters<BillingProvider['createCheckout']>[0]): Promise<{ url: string }> {
    const price = this.prices[input.planId];
    if (!price) {
      throw new NotImplementedException({ message: `The ${input.planId} plan is not purchasable yet`, code: 'PLAN_NOT_PURCHASABLE' });
    }
    const metadata = { userId: input.userId, planId: input.planId };
    const session = await this.stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      client_reference_id: input.userId,
      ...(input.customerId ? { customer: input.customerId } : { customer_email: input.email }),
      // Put the ids on the subscription itself, so later subscription webhooks carry them.
      subscription_data: { metadata },
      metadata,
      success_url: input.successUrl,
      cancel_url: input.cancelUrl,
    });
    if (!session.url) throw new ServiceUnavailableException({ message: 'Checkout could not be created', code: 'CHECKOUT_FAILED' });
    return { url: session.url };
  }

  async createPortal(input: { customerId: string; returnUrl: string }): Promise<{ url: string }> {
    const session = await this.stripe.billingPortal.sessions.create({
      customer: input.customerId,
      return_url: input.returnUrl,
    });
    return { url: session.url };
  }

  parseWebhook(rawBody: Buffer, signature: string): BillingWebhookEvent {
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawBody, signature, this.webhookSecret);
    } catch {
      throw new InvalidWebhookSignatureError('Invalid webhook signature');
    }

    const base = { id: event.id, type: event.type, occurredAt: new Date(event.created * 1000) };
    if (
      event.type !== 'customer.subscription.created' &&
      event.type !== 'customer.subscription.updated' &&
      event.type !== 'customer.subscription.deleted'
    ) {
      return { ...base, kind: 'ignored' };
    }

    const subscription = event.data.object;
    const planId = subscription.metadata?.planId;
    // The period end now lives on the subscription item, not the subscription.
    const periodEnd = subscription.items.data[0]?.current_period_end;
    return {
      ...base,
      kind: 'subscription',
      userId: subscription.metadata?.userId || null,
      planId: planId === 'pro' || planId === 'ultra' ? (planId as PaidPlanId) : null,
      // A deleted event carries the final object, whose status is already `canceled`.
      status: event.type === 'customer.subscription.deleted' ? 'canceled' : (STATUS_MAP[subscription.status] ?? 'incomplete'),
      customerId: typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id,
      subscriptionId: subscription.id,
      currentPeriodEnd: periodEnd ? new Date(periodEnd * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    };
  }
}
