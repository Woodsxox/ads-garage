"use client";

import { useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { estimateMonthlyRevenue, formatUsd, type EarningsRange } from "@/lib/earnings";
import { gsap, useGSAP } from "@/lib/gsap-client";
import type { PlacementId } from "@/lib/ad-sizes";

type EarningsEstimatorProps = {
  formatId: string;
  placement: PlacementId;
  density: number;
};

function animateCount(
  el: HTMLElement,
  to: number,
  reduce: boolean,
): void {
  const state = { value: Number(el.dataset.value ?? "0") };
  if (reduce) {
    el.textContent = formatUsd(to);
    el.dataset.value = String(to);
    return;
  }
  gsap.to(state, {
    value: to,
    duration: 0.7,
    ease: "power2.out",
    onUpdate: () => {
      el.textContent = formatUsd(Math.round(state.value));
    },
    onComplete: () => {
      el.dataset.value = String(to);
    },
  });
}

export function EarningsEstimator({ formatId, placement, density }: EarningsEstimatorProps) {
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const lowRef = useRef<HTMLSpanElement>(null);
  const highRef = useRef<HTMLSpanElement>(null);
  const range: EarningsRange = estimateMonthlyRevenue({ formatId, placement, density });

  useGSAP(
    () => {
      if (lowRef.current) animateCount(lowRef.current, range.low, Boolean(reduce));
      if (highRef.current) animateCount(highRef.current, range.high, Boolean(reduce));
    },
    { dependencies: [formatId, placement, density, range.low, range.high, reduce], scope: rootRef },
  );

  return (
    <section ref={rootRef} aria-labelledby="earnings-heading" className="rounded-xl bg-bay-wall p-4">
      <h2
        id="earnings-heading"
        className="font-display text-sm tracking-[0.04em] text-chalk"
      >
        Earnings readout
      </h2>
      <p className="mt-3 font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/50">
        Estimated monthly range
      </p>
      <p className="mt-2 flex items-baseline gap-2 font-mono text-2xl text-hazard">
        <span ref={lowRef} data-value="0">
          $0
        </span>
        <span className="text-chalk/40">–</span>
        <span ref={highRef} data-value="0">
          $0
        </span>
      </p>
      <p className="mt-3 font-body text-xs leading-5 text-chalk/65">
        Estimate based on industry-average RPM ranges at{" "}
        <span className="font-mono text-chalk">{range.pageviews.toLocaleString("en-US")}</span>{" "}
        pageviews/mo. Actual earnings depend on niche, geography, seasonality, and traffic
        quality. This is not a forecast.
      </p>
    </section>
  );
}
