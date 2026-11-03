"use client";

import { useMemo } from "react";
import Link from "next/link";
import { AFFILIATES, affiliateFor, FTC_DISCLOSURE } from "@/lib/affiliates";
import { formatTrafficNeed, qualifyNetworks } from "@/lib/networks";
import { STORAGE_KEYS } from "@/lib/storage";
import { InspectionTag } from "@/components/chrome/InspectionTag";
import { useStored } from "@/lib/use-stored";

export function QualificationChecker() {
  const [pageviews, setPageviews] = useStored(STORAGE_KEYS.guidePageviews, 8000);

  const rows = useMemo(() => qualifyNetworks(pageviews), [pageviews]);
  const eligible = rows.filter((row) => row.eligible);
  const locked = rows.filter((row) => !row.eligible);

  const onPageviews = (value: number) => {
    const next = Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
    setPageviews(next);
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-hazard">Guide · qualification</p>
      <h1 className="mt-2 font-display text-4xl tracking-[0.04em] text-chalk">
        Which network can you apply to
      </h1>
      <p className="mt-4 font-body text-sm leading-6 text-chalk/75">
        Enter current monthly pageviews. Networks sort into eligible now and not yet eligible.
        Exclusive programs are tagged — running a second tag beside them is how publishers get
        banned.
      </p>

      <label htmlFor="pageviews" className="mt-8 block font-display text-sm tracking-[0.04em]">
        Monthly pageviews
      </label>
      <input
        id="pageviews"
        type="number"
        min={0}
        step={1000}
        value={pageviews}
        aria-label="Current monthly pageviews"
        onChange={(event) => onPageviews(Number(event.target.value))}
        className="mt-2 w-full border border-white/15 bg-bay-floor px-3 py-2 font-mono text-lg text-hazard"
      />
      <p className="mt-2 font-body text-xs text-chalk/55">
        Mediavine counts sessions. We estimate sessions at 72% of pageviews so the gap is honest.
      </p>

      <section className="mt-10" aria-labelledby="eligible-heading">
        <h2 id="eligible-heading" className="font-display text-xl tracking-[0.04em]">
          Eligible now
        </h2>
        <ul className="mt-4 flex flex-col gap-4">
          {eligible.map(({ network }) => {
            const affiliate = affiliateFor(network.id);
            return (
              <li key={network.id} className="rounded-xl bg-bay-wall p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-body text-base text-chalk">{network.name}</h3>
                  {network.exclusive ? (
                    <InspectionTag>Exclusive — cannot run alongside another network</InspectionTag>
                  ) : (
                    <InspectionTag tone="torque">Eligible</InspectionTag>
                  )}
                </div>
                <p className="mt-2 font-mono text-[11px] text-hazard">
                  ${network.rpmRange.low}–${network.rpmRange.high} RPM · {formatTrafficNeed(network)}
                  {network.setupFee ? ` · $${network.setupFee} setup` : ""}
                </p>
                <p className="mt-2 font-body text-sm leading-6 text-chalk/70">{network.notes}</p>
                {affiliate ? (
                  <p className="mt-3 font-body text-xs text-chalk/60">
                    <a
                      href={affiliate.href}
                      className="text-hazard underline-offset-2 hover:underline"
                      rel="sponsored noopener noreferrer"
                      target="_blank"
                    >
                      {affiliate.label}
                    </a>
                    <span className="ml-2 text-chalk/45">Affiliate link</span>
                  </p>
                ) : network.id === "adsense" ? (
                  <p className="mt-3 font-body text-xs text-chalk/50">
                    Google AdSense has no referral programme. Apply from your own Google account.
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-10" aria-labelledby="locked-heading">
        <h2 id="locked-heading" className="font-display text-xl tracking-[0.04em]">
          Not yet eligible
        </h2>
        {locked.length === 0 ? (
          <p className="mt-3 font-body text-sm text-chalk/65">No remaining traffic gates at this volume.</p>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            {locked.map(({ network, gap, gapUnit }) => (
              <li key={network.id} className="border border-flag/40 bg-bay-wall p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-body text-base text-chalk">{network.name}</h3>
                  {network.exclusive ? (
                    <InspectionTag>Exclusive — cannot run alongside another network</InspectionTag>
                  ) : null}
                  <InspectionTag tone="flag">Locked</InspectionTag>
                </div>
                <p className="mt-2 font-mono text-[11px] text-flag">
                  Gap: {gap.toLocaleString("en-US")} {gapUnit}
                </p>
                <p className="mt-2 font-body text-sm leading-6 text-chalk/70">{network.notes}</p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-10 font-body text-xs leading-5 text-chalk/50">{FTC_DISCLOSURE}</p>
      {AFFILIATES.length ? (
        <p className="mt-2 font-mono text-[10px] text-chalk/35">
          Referral URLs live in <span className="text-chalk/55">lib/affiliates.ts</span>.
        </p>
      ) : null}

      <p className="mt-8 font-body text-sm">
        <Link href="/guide/exclusive-vs-non-exclusive-networks" className="text-hazard">
          Read the exclusivity manual →
        </Link>
      </p>
    </div>
  );
}
