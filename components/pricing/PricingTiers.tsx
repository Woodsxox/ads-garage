"use client";

import { useState } from "react";
import { InspectionTag } from "@/components/chrome/InspectionTag";
import { setTier, type TierId } from "@/lib/tier";

async function startCheckout(kind: "export" | "pro"): Promise<string> {
  const res = await fetch("/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind }),
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error ?? "Checkout is not configured.");
  }
  return data.url;
}

export function PricingTiers() {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const pay = async (kind: "export" | "pro") => {
    setError(null);
    setBusy(kind);
    try {
      const url = await startCheckout(kind);
      window.location.href = url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setBusy(null);
    }
  };

  const devUnlock = (tier: TierId) => {
    setTier(tier);
    setError(`Dev unlock set to ${tier}. Export is available in this browser.`);
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-hazard">Rate card</p>
      <h1 className="mt-2 font-display text-4xl tracking-[0.04em] text-chalk">
        Three bays
      </h1>
      <p className="mt-4 max-w-2xl font-body text-sm leading-6 text-chalk/75">
        Inspector is funded by editorial-route impressions on the guide and bay notes — not by
        live ads in the showroom. Pro is layout tooling inside one network. It is not an
        optimiser that hops tags.
      </p>

      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        <article className="rounded-xl bg-bay-wall p-5">
          <h2 className="font-display text-xl tracking-[0.04em]">Inspector</h2>
          <p className="mt-2 font-mono text-2xl text-hazard">Free</p>
          <ul className="mt-4 flex flex-col gap-2 font-body text-sm leading-6 text-chalk/75">
            <li>Full showroom with mock units</li>
            <li>Qualification-gated network guide</li>
            <li>Unlimited previews</li>
            <li>No export</li>
          </ul>
        </article>

        <article className="border border-hazard bg-bay-wall p-5">
          <h2 className="font-display text-xl tracking-[0.04em]">Single Export</h2>
          <p className="mt-2 font-mono text-2xl text-hazard">$7.99</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/50">
            One-time · Stripe Checkout
          </p>
          <ul className="mt-4 flex flex-col gap-2 font-body text-sm leading-6 text-chalk/75">
            <li>One zip: snippet, CSS, install README, pre-flight</li>
            <li>Your publisher ID and slot ID only</li>
          </ul>
          <button
            type="button"
            onClick={() => pay("export")}
            disabled={busy !== null}
            className="mt-6 w-full border border-hazard bg-hazard px-3 py-2 font-display text-sm tracking-[0.04em] text-bay-floor disabled:opacity-50"
          >
            {busy === "export" ? "Opening Checkout…" : "Buy single export"}
          </button>
        </article>

        <article className="rounded-xl bg-bay-wall p-5">
          <h2 className="font-display text-xl tracking-[0.04em]">Garage Pro</h2>
          <p className="mt-2 font-mono text-2xl text-hazard">$24/mo</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/50">
            Stripe Billing
          </p>
          <ul className="mt-4 flex flex-col gap-2 font-body text-sm leading-6 text-chalk/75">
            <li>Unlimited exports</li>
            <li>Saved layout library</li>
            <li>A/B layout comparison within a single network</li>
            <li>Revenue-per-layout tracking</li>
            <li>Alerts on layout-quality regressions</li>
          </ul>
          <div className="mt-4 flex flex-col gap-2">
            <InspectionTag tone="flag">Does not rotate code between networks</InspectionTag>
            <InspectionTag tone="flag">Does not inject ad code automatically</InspectionTag>
            <InspectionTag tone="flag">Does not auto-refresh ad units</InspectionTag>
          </div>
          <p className="mt-4 font-body text-xs leading-5 text-chalk/60">
            Layout testing within your network — not automatic optimisation across all networks.
            Cross-network rotation would breach exclusivity at Mediavine, Raptive, and
            Monumetric.
          </p>
          <button
            type="button"
            onClick={() => pay("pro")}
            disabled={busy !== null}
            className="mt-6 w-full border border-hazard px-3 py-2 font-display text-sm tracking-[0.04em] text-hazard disabled:opacity-50"
          >
            {busy === "pro" ? "Opening Billing…" : "Subscribe to Pro"}
          </button>
        </article>
      </div>

      {error ? (
        <p className="mt-6 font-body text-sm text-flag" role="status">
          {error}
        </p>
      ) : null}

      {process.env.NODE_ENV !== "production" ? (
        <div className="mt-10 border border-white/10 p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/50">
            Development only — Stripe keys not required
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => devUnlock("single")}
              className="border border-white/20 px-3 py-1 font-mono text-[11px] uppercase text-chalk"
            >
              Test unlock single
            </button>
            <button
              type="button"
              onClick={() => devUnlock("pro")}
              className="border border-white/20 px-3 py-1 font-mono text-[11px] uppercase text-chalk"
            >
              Test unlock pro
            </button>
            <button
              type="button"
              onClick={() => devUnlock("inspector")}
              className="border border-white/20 px-3 py-1 font-mono text-[11px] uppercase text-chalk"
            >
              Reset to inspector
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
