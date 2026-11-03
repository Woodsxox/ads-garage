import { redirect } from "next/navigation";

/** Pricing moved to /plans (Starter, Pro, Ultra). The old Stripe-backed tiers are not wired to the UI. */
export default function PricingRedirectPage() {
  redirect("/plans");
}
