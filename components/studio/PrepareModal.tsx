"use client";

import { useMemo, useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { PLATFORMS, getPlatform } from "@/lib/demo/platforms";
import type { CheckResult, PlatformId } from "@/lib/domain/types";
import { summarize, validateForPlatform } from "@/lib/studio/validate";
import type { AdDesign } from "@/lib/studio/model";

const STATUS_STYLE: Record<CheckResult["status"], { icon: "check" | "alert" | "x"; cls: string }> = {
  pass: { icon: "check", cls: "text-torque" },
  warn: { icon: "alert", cls: "text-hazard" },
  fail: { icon: "x", cls: "text-flag" },
};

export function PrepareModal({
  design,
  open,
  onClose,
  onExport,
  onOpenWorkflow,
}: {
  design: AdDesign;
  open: boolean;
  onClose: () => void;
  onExport: () => void;
  onOpenWorkflow: (platformId: PlatformId) => void;
}) {
  const [platformId, setPlatformId] = useState<PlatformId>("google-ads");
  const platform = getPlatform(platformId) ?? PLATFORMS[0];
  const results = useMemo(() => (open ? validateForPlatform(design, platform) : []), [design, platform, open]);
  const summary = summarize(results);

  return (
    <Modal open={open} onClose={onClose} title="Prepare for a platform" size="md">
      <p className="font-body text-sm leading-6 text-chalk/70">
        Check your design against a platform&apos;s creative requirements, export it, then finish setup in that
        platform&apos;s own tools. Ads Garage does not publish anything for you in this release.
      </p>

      <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label="Destination platform">
        {PLATFORMS.map((p) => (
          <button
            key={p.id}
            type="button"
            aria-pressed={platformId === p.id}
            onClick={() => setPlatformId(p.id)}
            className={`border px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.04em] ${
              platformId === p.id ? "border-hazard bg-hazard text-bay-floor" : "border-white/20 text-chalk/75 hover:border-chalk/50"
            }`}
          >
            {p.name}
          </button>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="font-display text-sm tracking-[0.04em]">Checks</p>
        <p className="font-mono text-[11px] text-chalk/60" role="status">
          {summary.pass} pass · {summary.warn} warn · {summary.fail} fail
        </p>
      </div>
      <ul className="mt-2 flex max-h-64 flex-col gap-1.5 overflow-y-auto pr-1">
        {results.map((r) => {
          const s = STATUS_STYLE[r.status];
          return (
            <li key={r.id} className="flex gap-2.5 border border-white/10 p-2.5">
              <Icon name={s.icon} size={15} className={`mt-0.5 shrink-0 ${s.cls}`} />
              <div>
                <p className="font-body text-sm text-chalk">
                  {r.label}
                  <span className="sr-only"> — {r.status}</span>
                </p>
                <p className="font-body text-xs leading-5 text-chalk/60">{r.detail}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <p className="mt-2 font-body text-[11px] leading-4 text-chalk/45">
        Platform limits shown are illustrative for this demo and will be verified against each platform&apos;s current
        documentation before launch.
      </p>

      <ol className="mt-5 flex flex-col gap-2 border-t border-white/10 pt-4">
        <li className="flex items-center justify-between gap-3">
          <span className="font-body text-sm text-chalk/80">1. Export your assets</span>
          <Button size="sm" variant="secondary" onClick={onExport}>
            <Icon name="download" size={13} /> Export
          </Button>
        </li>
        <li className="flex items-center justify-between gap-3">
          <span className="font-body text-sm text-chalk/80">2. Create the campaign in {platform.name}</span>
          <ButtonLink href={platform.dashboardUrl} external size="sm" variant="secondary">
            {platform.dashboardLabel} <Icon name="external" size={12} />
          </ButtonLink>
        </li>
        <li className="flex items-center justify-between gap-3">
          <span className="font-body text-sm text-chalk/80">3. Rehearse the workflow in Ads Garage</span>
          <Button size="sm" variant="ghost" onClick={() => onOpenWorkflow(platformId)}>
            Demo workflow <Icon name="arrowRight" size={12} />
          </Button>
        </li>
      </ol>
    </Modal>
  );
}
