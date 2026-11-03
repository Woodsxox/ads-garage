"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { setTier, type TierId } from "@/lib/tier";
import { Suspense } from "react";

function SuccessInner() {
  const params = useSearchParams();
  const tierParam = params.get("tier");
  const tier: TierId = tierParam === "pro" ? "pro" : "single";

  useEffect(() => {
    setTier(tier);
  }, [tier]);

  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-torque">Unlocked</p>
      <h1 className="mt-2 font-display text-3xl tracking-[0.04em]">
        {tier === "pro" ? "Garage Pro unlocked" : "Single export unlocked"}
      </h1>
      <p className="mt-4 font-body text-sm leading-6 text-chalk/75">
        This browser can now download a bundle from the creator. Paste your own publisher ID and
        slot ID — never test the result on a demo page.
      </p>
      <Link
        href="/build"
        className="mt-6 inline-block border border-hazard bg-hazard px-4 py-2 font-display text-sm tracking-[0.04em] text-bay-floor"
      >
        Go to the build bay
      </Link>
    </div>
  );
}

export default function PricingSuccessPage() {
  return (
    <Suspense fallback={<p className="p-8 font-mono text-sm text-chalk">Loading…</p>}>
      <SuccessInner />
    </Suspense>
  );
}
