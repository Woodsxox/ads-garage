"use client";

import { NETWORKS, formatTrafficNeed } from "@/lib/networks";
import { InspectionTag } from "@/components/chrome/InspectionTag";

export function NetworkMatrix() {
  return (
    <section aria-labelledby="matrix-heading" className="rounded-xl bg-bay-wall p-4">
      <h2
        id="matrix-heading"
        className="font-display text-sm tracking-[0.04em] text-chalk"
      >
        Network bay
      </h2>
      <ul className="mt-3 flex flex-col gap-3">
        {NETWORKS.map((network) => (
          <li key={network.id} className="border-t border-white/10 pt-3 first:border-t-0 first:pt-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="font-body text-sm text-chalk">{network.name}</p>
              {network.exclusive ? (
                <InspectionTag>Exclusive — cannot run alongside another network</InspectionTag>
              ) : (
                <InspectionTag tone="chalk">Non-exclusive</InspectionTag>
              )}
            </div>
            <p className="mt-1 font-mono text-[11px] text-hazard">
              {formatUsdRange(network.rpmRange.low, network.rpmRange.high)} RPM
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/50">
              {formatTrafficNeed(network)}
              {network.setupFee ? ` · $${network.setupFee} setup` : ""}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}

function formatUsdRange(low: number, high: number): string {
  return `$${low}–$${high}`;
}
