import { appOrigin, getStripe, stripeConfigured } from "@/lib/stripe";

/** Dedicated Billing entry for Garage Pro. Same Checkout session in subscription mode. */
export async function POST() {
  if (!stripeConfigured()) {
    return Response.json(
      {
        error:
          "Stripe Billing is not configured. Set STRIPE_SECRET_KEY and STRIPE_PRICE_PRO in .env.local.",
      },
      { status: 501 },
    );
  }

  const price = process.env.STRIPE_PRICE_PRO;
  if (!price) {
    return Response.json({ error: "Missing STRIPE_PRICE_PRO." }, { status: 501 });
  }

  const stripe = await getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    success_url: `${appOrigin()}/pricing/success?tier=pro`,
    cancel_url: `${appOrigin()}/pricing`,
  });

  return Response.json({ url: session.url });
}
