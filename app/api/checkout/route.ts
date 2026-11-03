import type Stripe from "stripe";
import { appOrigin, getStripe, stripeConfigured } from "@/lib/stripe";

export async function POST(request: Request) {
  const body = (await request.json()) as { kind?: "export" | "pro" };
  const kind = body.kind === "pro" ? "pro" : "export";

  if (!stripeConfigured()) {
    return Response.json(
      {
        error:
          "Stripe is not configured. Set STRIPE_SECRET_KEY and STRIPE_PRICE_EXPORT / STRIPE_PRICE_PRO in .env.local (see .env.example). Never hardcode keys.",
      },
      { status: 501 },
    );
  }

  const price =
    kind === "pro" ? process.env.STRIPE_PRICE_PRO : process.env.STRIPE_PRICE_EXPORT;
  if (!price) {
    return Response.json(
      { error: `Missing ${kind === "pro" ? "STRIPE_PRICE_PRO" : "STRIPE_PRICE_EXPORT"}.` },
      { status: 501 },
    );
  }

  const stripe = await getStripe();
  const origin = appOrigin();
  const session = await stripe.checkout.sessions.create({
    mode: kind === "pro" ? "subscription" : "payment",
    line_items: [{ price, quantity: 1 }],
    success_url: `${origin}/pricing/success?tier=${kind === "pro" ? "pro" : "single"}`,
    cancel_url: `${origin}/pricing`,
  } satisfies Stripe.Checkout.SessionCreateParams);

  return Response.json({ url: session.url });
}
