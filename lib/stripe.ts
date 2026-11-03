import type { Stripe } from "stripe";

/**
 * Stripe helpers. Secret keys stay in env — never in source.
 *
 * TODO: paste STRIPE_SECRET_KEY in .env.local (sk_test_… for development).
 * TODO: create a one-time price for $7.99 and set STRIPE_PRICE_EXPORT.
 * TODO: create a recurring $24/mo price and set STRIPE_PRICE_PRO.
 */

export function stripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  return Boolean(key && !key.includes("TODO") && key.startsWith("sk_"));
}

export async function getStripe(): Promise<Stripe> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.includes("TODO")) {
    throw new Error("STRIPE_SECRET_KEY is not set. Add it to .env.local — never hardcode it.");
  }
  const { default: StripeClient } = await import("stripe");
  return new StripeClient(key);
}

export function appOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
}
