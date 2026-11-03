import type { PlanId } from '../plan-catalog.js';
import type { SubscriptionStatus } from '../subscription.entity.js';

export type PaidPlanId = Exclude<PlanId, 'starter'>;

/** A provider-neutral webhook event. Only subscription changes matter to entitlements. */
export type BillingWebhookEvent = { id: string; type: string; occurredAt: Date } & (
  | {
      kind: 'subscription';
      /** From the metadata we attach at checkout. Missing for subscriptions created elsewhere. */
      userId: string | null;
      planId: PaidPlanId | null;
      status: SubscriptionStatus;
      customerId: string;
      subscriptionId: string;
      currentPeriodEnd: Date | null;
      cancelAtPeriodEnd: boolean;
    }
  | { kind: 'ignored' }
);

export class InvalidWebhookSignatureError extends Error {}

/**
 * The payment processor, behind an interface. Stripe is the first implementation; the rest of the
 * app (entitlements, controllers, tests) only knows this shape.
 */
export abstract class BillingProvider {
  /** False when no processor is configured. Checkout and portal then refuse politely. */
  abstract readonly enabled: boolean;

  abstract createCheckout(input: {
    userId: string;
    email: string;
    planId: PaidPlanId;
    customerId: string | null;
    successUrl: string;
    cancelUrl: string;
  }): Promise<{ url: string }>;

  abstract createPortal(input: { customerId: string; returnUrl: string }): Promise<{ url: string }>;

  /** Verifies the signature and normalises the event. Throws `InvalidWebhookSignatureError` if it does not verify. */
  abstract parseWebhook(rawBody: Buffer, signature: string): BillingWebhookEvent;
}
