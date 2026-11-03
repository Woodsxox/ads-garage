"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { MockAd } from "@/components/ads/MockAd";
import { InspectionTag } from "@/components/chrome/InspectionTag";
import {
  AD_FORMATS,
  PLACEMENTS,
  getFormat,
  isValidFormatId,
  type PlacementId,
} from "@/lib/ad-sizes";
import { downloadExport, buildChecklist, type ExportPlatform, type SlotStyle } from "@/lib/export";
import { SANE_DENSITY_MAX, type SavedLayout } from "@/lib/layouts";
import { NETWORKS } from "@/lib/networks";
import { STORAGE_KEYS, storage } from "@/lib/storage";
import { canExport, recordExport, type TierId } from "@/lib/tier";
import { estimateMonthlyRevenue, formatUsd } from "@/lib/earnings";
import { useStored } from "@/lib/use-stored";

const STEPS = ["platform", "format", "placement", "styling", "review", "export"] as const;
type Step = (typeof STEPS)[number];

type Draft = {
  step: Step;
  platform: ExportPlatform;
  formatId: string;
  placement: PlacementId;
  density: number;
  publisherId: string;
  slotId: string;
  style: SlotStyle;
  networkId: string;
};

const DEFAULT_DRAFT: Draft = {
  step: "platform",
  platform: "nextjs",
  formatId: "300x250",
  placement: "in-content",
  density: 2,
  publisherId: "",
  slotId: "",
  networkId: "adsense",
  style: {
    align: "center",
    maxWidth: "unit",
    padding: "comfortable",
    surface: "transparent",
  },
};

const PLATFORMS: { id: ExportPlatform; label: string; note: string }[] = [
  { id: "wordpress", label: "WordPress", note: "Custom HTML block on a real post" },
  { id: "nextjs", label: "Next.js", note: "Client unit for editorial routes" },
  { id: "html", label: "Plain HTML", note: "Head script once, snippet in the article" },
  { id: "shopify", label: "Shopify", note: "Custom Liquid on article templates" },
];

export function CreatorTool() {
  const [storedDraft, setStoredDraft] = useStored<Draft>(STORAGE_KEYS.buildDraft, DEFAULT_DRAFT);
  const [library, setLibrary] = useStored<SavedLayout[]>(STORAGE_KEYS.layoutLibrary, []);
  const [tier] = useStored<TierId>(STORAGE_KEYS.tier, "inspector");
  const [compareId, setCompareId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const draft = isValidFormatId(storedDraft.formatId) ? storedDraft : DEFAULT_DRAFT;
  const pro = tier === "pro";

  const persist = (next: Draft) => {
    setStoredDraft(next);
  };

  const format = getFormat(draft.formatId);
  const checklist = useMemo(
    () =>
      buildChecklist({
        platform: draft.platform,
        formatId: draft.formatId,
        placement: draft.placement,
        density: draft.density,
        publisherId: draft.publisherId,
        slotId: draft.slotId,
        style: draft.style,
      }),
    [draft],
  );
  const stepIndex = STEPS.indexOf(draft.step);
  const compareLayout = library.find((item) => item.id === compareId) ?? null;
  const currentEstimate = estimateMonthlyRevenue({
    formatId: draft.formatId,
    placement: draft.placement,
    density: draft.density,
  });
  const compareEstimate = compareLayout
    ? estimateMonthlyRevenue({
        formatId: compareLayout.formatId,
        placement: compareLayout.placement,
        density: compareLayout.density,
      })
    : null;

  const go = (step: Step) => persist({ ...draft, step });

  const saveLayout = () => {
    if (!pro) {
      setMessage("Saved layouts are Garage Pro. Upgrade to keep a library.");
      return;
    }
    const entry: SavedLayout = {
      id: crypto.randomUUID(),
      name: `${draft.platform} ${format.label} ${draft.placement}`,
      createdAt: new Date().toISOString(),
      platform: draft.platform,
      formatId: draft.formatId,
      placement: draft.placement,
      density: draft.density,
      networkId: draft.networkId,
      style: draft.style,
    };
    const next = [entry, ...library];
    setLibrary(next);
    const revenue = storage.get(STORAGE_KEYS.layoutRevenue, [] as Array<{
      layoutId: string;
      at: string;
      rpmLow: number;
      rpmHigh: number;
    }>);
    storage.set(STORAGE_KEYS.layoutRevenue, [
      {
        layoutId: entry.id,
        at: entry.createdAt,
        rpmLow: currentEstimate.low,
        rpmHigh: currentEstimate.high,
      },
      ...revenue,
    ]);
    setMessage("Layout saved to the library.");
  };

  const onExport = async () => {
    const gate = canExport();
    if (!gate.ok) {
      setMessage(gate.reason);
      return;
    }
    const failed = checklist.filter((item) => !item.ok);
    if (failed.length) {
      setMessage("Pre-flight failed. Fix the flagged items before downloading.");
      return;
    }
    setBusy(true);
    try {
      await downloadExport({
        platform: draft.platform,
        formatId: draft.formatId,
        placement: draft.placement,
        density: draft.density,
        publisherId: draft.publisherId,
        slotId: draft.slotId,
        style: draft.style,
      });
      recordExport();
      setMessage("Bundle downloaded. Install it on a real article page — never on a demo.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto grid max-w-[1440px] gap-4 px-4 py-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:px-6">
      <div className="rounded-xl bg-bay-wall p-4 sm:p-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-hazard">Snippet builder</p>
        <h1 className="mt-1 font-display text-3xl tracking-[0.04em] text-chalk">
          Build a layout
        </h1>
        <ol className="mt-4 flex flex-wrap gap-2" aria-label="Build steps">
          {STEPS.map((step, index) => (
            <li key={step}>
              <button
                type="button"
                aria-current={draft.step === step ? "step" : undefined}
                onClick={() => go(step)}
                className={`border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.04em] ${
                  draft.step === step ? "border-hazard text-hazard" : "border-white/15 text-chalk/60"
                }`}
              >
                {index + 1} {step}
              </button>
            </li>
          ))}
        </ol>

        {draft.step === "platform" ? (
          <fieldset className="mt-8">
            <legend className="font-display text-lg tracking-[0.04em]">Platform</legend>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {PLATFORMS.map((platform) => (
                <button
                  key={platform.id}
                  type="button"
                  aria-pressed={draft.platform === platform.id}
                  aria-label={platform.label}
                  onClick={() => persist({ ...draft, platform: platform.id })}
                  className={`border p-4 text-left ${
                    draft.platform === platform.id
                      ? "border-hazard text-hazard"
                      : "border-white/15 text-chalk"
                  }`}
                >
                  <span className="block font-display text-sm tracking-[0.04em]">
                    {platform.label}
                  </span>
                  <span className="mt-1 block font-body text-xs text-chalk/60">{platform.note}</span>
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        {draft.step === "format" ? (
          <fieldset className="mt-8">
            <legend className="font-display text-lg tracking-[0.04em]">Format</legend>
            <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {AD_FORMATS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={draft.formatId === item.id}
                  aria-label={`Format ${item.label}`}
                  onClick={() => persist({ ...draft, formatId: item.id })}
                  className={`border px-3 py-3 text-left ${
                    draft.formatId === item.id
                      ? "border-hazard text-hazard"
                      : "border-white/15 text-chalk"
                  }`}
                >
                  <span className="block font-display text-xs ">{item.label}</span>
                  <span className="font-mono text-[10px]">{item.previewLabel}</span>
                </button>
              ))}
            </div>
          </fieldset>
        ) : null}

        {draft.step === "placement" ? (
          <div className="mt-8">
            <fieldset>
              <legend className="font-display text-lg tracking-[0.04em]">Placement</legend>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {(Object.values(PLACEMENTS) as Array<(typeof PLACEMENTS)[PlacementId]>).map(
                  (place) => (
                    <button
                      key={place.id}
                      type="button"
                      aria-pressed={draft.placement === place.id}
                      aria-label={`Placement ${place.label}`}
                      onClick={() => persist({ ...draft, placement: place.id })}
                      className={`border px-3 py-3 font-display text-xs ${
                        draft.placement === place.id
                          ? "border-hazard text-hazard"
                          : "border-white/15 text-chalk"
                      }`}
                    >
                      {place.label}
                    </button>
                  ),
                )}
              </div>
            </fieldset>
            <label htmlFor="build-density" className="mt-6 block font-display text-sm tracking-[0.04em]">
              Density
            </label>
            <input
              id="build-density"
              type="range"
              min={1}
              max={5}
              value={draft.density}
              aria-label="Ad slots per page"
              onChange={(event) => persist({ ...draft, density: Number(event.target.value) })}
              className="mt-2 w-full accent-[#1EFF66]"
            />
            <p className="mt-1 font-mono text-[11px] text-chalk/60">{draft.density} / page</p>
            {draft.density > SANE_DENSITY_MAX ? (
              <div className="mt-3">
                <InspectionTag tone="flag">Density above spec</InspectionTag>
              </div>
            ) : null}
            <label htmlFor="network" className="mt-6 block font-display text-sm tracking-[0.04em]">
              Network (A/B stays inside this one)
            </label>
            <select
              id="network"
              value={draft.networkId}
              aria-label="Ad network for this layout"
              onChange={(event) => persist({ ...draft, networkId: event.target.value })}
              className="mt-2 w-full border border-white/15 bg-bay-floor px-3 py-2 font-body text-sm text-chalk"
            >
              {NETWORKS.map((network) => (
                <option key={network.id} value={network.id}>
                  {network.name}
                  {network.exclusive ? " — EXCLUSIVE" : ""}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        {draft.step === "styling" ? (
          <fieldset className="mt-8 grid gap-4 sm:grid-cols-2">
            <legend className="font-display text-lg tracking-[0.04em]">Styling</legend>
            <label className="block font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/70">
              Align
              <select
                className="mt-2 w-full border border-white/15 bg-bay-floor px-3 py-2 font-body text-sm text-chalk"
                value={draft.style.align}
                aria-label="Slot alignment"
                onChange={(event) =>
                  persist({
                    ...draft,
                    style: { ...draft.style, align: event.target.value as SlotStyle["align"] },
                  })
                }
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </label>
            <label className="block font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/70">
              Max width
              <select
                className="mt-2 w-full border border-white/15 bg-bay-floor px-3 py-2 font-body text-sm text-chalk"
                value={draft.style.maxWidth}
                aria-label="Slot max width"
                onChange={(event) =>
                  persist({
                    ...draft,
                    style: {
                      ...draft.style,
                      maxWidth: event.target.value as SlotStyle["maxWidth"],
                    },
                  })
                }
              >
                <option value="unit">Unit size</option>
                <option value="container">Container</option>
              </select>
            </label>
            <label className="block font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/70">
              Padding
              <select
                className="mt-2 w-full border border-white/15 bg-bay-floor px-3 py-2 font-body text-sm text-chalk"
                value={draft.style.padding}
                aria-label="Slot padding"
                onChange={(event) =>
                  persist({
                    ...draft,
                    style: { ...draft.style, padding: event.target.value as SlotStyle["padding"] },
                  })
                }
              >
                <option value="compact">Compact</option>
                <option value="comfortable">Comfortable</option>
              </select>
            </label>
            <label className="block font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/70">
              Surface
              <select
                className="mt-2 w-full border border-white/15 bg-bay-floor px-3 py-2 font-body text-sm text-chalk"
                value={draft.style.surface}
                aria-label="Slot surface"
                onChange={(event) =>
                  persist({
                    ...draft,
                    style: { ...draft.style, surface: event.target.value as SlotStyle["surface"] },
                  })
                }
              >
                <option value="transparent">Transparent</option>
                <option value="panel">Quiet panel</option>
              </select>
            </label>
          </fieldset>
        ) : null}

        {draft.step === "review" || draft.step === "export" ? (
          <div className="mt-8">
            <h2 className="font-display text-lg tracking-[0.04em]">Pre-flight</h2>
            <ul className="mt-4 flex flex-col gap-3">
              {checklist.map((item) => (
                <li key={item.id} className="border border-white/10 p-3">
                  <div className="flex items-center gap-2">
                    <InspectionTag tone={item.ok ? "torque" : "flag"}>
                      {item.ok ? "Pass" : "Fail"}
                    </InspectionTag>
                    <span className="font-body text-sm">{item.label}</span>
                  </div>
                  <p className="mt-2 font-body text-xs leading-5 text-chalk/65">{item.detail}</p>
                </li>
              ))}
            </ul>
            {draft.step === "export" ? (
              <div className="mt-6 grid gap-3">
                <label className="block font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/70">
                  Publisher ID
                  <input
                    value={draft.publisherId}
                    onChange={(event) => persist({ ...draft, publisherId: event.target.value })}
                    placeholder="ca-pub-1234567890123456"
                    aria-label="Your publisher ID"
                    className="mt-2 w-full border border-white/15 bg-bay-floor px-3 py-2 font-mono text-sm text-chalk"
                  />
                </label>
                <label className="block font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/70">
                  Slot ID
                  <input
                    value={draft.slotId}
                    onChange={(event) => persist({ ...draft, slotId: event.target.value })}
                    placeholder="1234567890"
                    aria-label="Your ad slot ID"
                    className="mt-2 w-full border border-white/15 bg-bay-floor px-3 py-2 font-mono text-sm text-chalk"
                  />
                </label>
                <p className="font-body text-xs text-chalk/55">
                  These IDs are yours. The zip never includes Ad Garage inventory.
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={onExport}
                    disabled={busy}
                    className="border border-hazard bg-hazard px-4 py-2 font-display text-sm tracking-[0.04em] text-bay-floor disabled:opacity-50"
                  >
                    {busy ? "Packing…" : "Download zip"}
                  </button>
                  <button
                    type="button"
                    onClick={saveLayout}
                    className="border border-white/20 px-4 py-2 font-display text-sm tracking-[0.04em] text-chalk"
                  >
                    Save to library
                  </button>
                  <Link
                    href="/pricing"
                    className="border border-white/20 px-4 py-2 font-display text-sm tracking-[0.04em] text-chalk"
                  >
                    Unlock export
                  </Link>
                </div>
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="mt-8 flex gap-2">
          <button
            type="button"
            disabled={stepIndex === 0}
            onClick={() => go(STEPS[stepIndex - 1])}
            className="border border-white/20 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.04em] text-chalk disabled:opacity-30"
          >
            Back
          </button>
          <button
            type="button"
            disabled={stepIndex === STEPS.length - 1}
            onClick={() => go(STEPS[stepIndex + 1])}
            className="border border-hazard px-3 py-2 font-mono text-[11px] uppercase tracking-[0.04em] text-hazard disabled:opacity-30"
          >
            Next
          </button>
        </div>
        {message ? (
          <p className="mt-4 font-body text-sm text-hazard" role="status">
            {message}
          </p>
        ) : null}
      </div>

      <aside className="flex flex-col gap-4" aria-label="Preview and library">
        <div className="border border-white/10 bg-bay-floor p-4">
          <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-hazard">
            Preview · mock only
          </p>
          <div className="mt-3 overflow-x-auto">
            <MockAd format={format} />
          </div>
        </div>

        {pro ? (
          <div className="rounded-xl bg-bay-wall p-4">
            <h2 className="font-display text-sm tracking-[0.04em]">Layout library</h2>
            <p className="mt-2 font-body text-xs text-chalk/60">
              A/B compares two layouts on the same network. Cross-network rotation is not offered.
            </p>
            {library.length === 0 ? (
              <p className="mt-3 font-body text-xs text-chalk/50">No saved layouts yet.</p>
            ) : (
              <ul className="mt-3 flex flex-col gap-2">
                {library.map((item) => {
                  const regression =
                    item.density > SANE_DENSITY_MAX
                      ? "Layout-quality regression: density above spec"
                      : null;
                  const sameNetwork = item.networkId === draft.networkId;
                  return (
                    <li key={item.id} className="border border-white/10 p-2">
                      <p className="font-mono text-[11px] text-chalk">{item.name}</p>
                      <p className="font-mono text-[10px] text-chalk/50">
                        {item.networkId} · {item.formatId} · {item.placement}
                      </p>
                      {regression ? (
                        <p className="mt-1 font-body text-[11px] text-flag">{regression}</p>
                      ) : null}
                      <button
                        type="button"
                        disabled={!sameNetwork}
                        aria-label={`Compare ${item.name}`}
                        onClick={() => setCompareId(item.id)}
                        className="mt-2 font-mono text-[10px] uppercase tracking-[0.04em] text-hazard disabled:text-chalk/30"
                      >
                        {sameNetwork ? "A/B against current" : "Different network — blocked"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
            {compareLayout && compareEstimate ? (
              <div className="mt-4 border border-hazard/40 p-3">
                <p className="font-display text-xs tracking-[0.04em] text-hazard">
                  A/B inside {draft.networkId}
                </p>
                <p className="mt-2 font-mono text-[11px] text-chalk">
                  Current {formatUsd(currentEstimate.low)}–{formatUsd(currentEstimate.high)}
                </p>
                <p className="font-mono text-[11px] text-chalk">
                  Saved {formatUsd(compareEstimate.low)}–{formatUsd(compareEstimate.high)}
                </p>
                <p className="mt-2 font-body text-[11px] text-chalk/55">
                  Ranges are estimates, not billed revenue. Tracking stores the range per saved
                  layout so you can see regressions — not to auto-refresh units.
                </p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-xl bg-bay-wall p-4">
            <p className="font-body text-xs leading-5 text-chalk/65">
              Garage Pro adds a saved library, A/B comparison within a single network, and
              revenue-per-layout tracking. It does not rotate code between networks and it does
              not auto-refresh units.
            </p>
            <Link href="/pricing" className="mt-3 inline-block font-mono text-[11px] uppercase tracking-[0.04em] text-hazard">
              See Garage Pro
            </Link>
          </div>
        )}
      </aside>
    </div>
  );
}
