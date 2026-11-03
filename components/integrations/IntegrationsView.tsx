"use client";

import { useState } from "react";
import { ConnectModal } from "@/components/integrations/ConnectModal";
import { PublishWizard } from "@/components/integrations/PublishWizard";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { PLATFORMS } from "@/lib/demo/platforms";
import type { CampaignStatus, CapabilityLevel, Platform, PlatformId } from "@/lib/domain/types";
import { integrationsService } from "@/lib/services";
import { useAccounts, useCampaigns, useNow } from "@/lib/services/hooks";
import { deriveStatus } from "@/lib/services/mock/integrations";

const LEVEL: Record<CapabilityLevel, { label: string; dot: "good" | "accent" | "chalk" }> = {
  likely: { label: "Likely supported", dot: "good" },
  limited: { label: "Limited", dot: "accent" },
  unverified: { label: "Unverified", dot: "chalk" },
};

const STATUS: Record<CampaignStatus, { label: string; dot: "good" | "accent" | "chalk" | "bad" }> = {
  draft: { label: "Draft", dot: "chalk" },
  in_review: { label: "In review", dot: "accent" },
  approved: { label: "Approved", dot: "good" },
  running: { label: "Running", dot: "good" },
  paused: { label: "Paused", dot: "bad" },
};

function PlatformCard({ platform, onConnect }: { platform: Platform; onConnect: (p: Platform) => void }) {
  const accounts = useAccounts();
  const account = accounts.find((a) => a.platformId === platform.id);
  const [busy, setBusy] = useState(false);

  const disconnect = async () => {
    setBusy(true);
    await integrationsService.disconnect(platform.id);
    setBusy(false);
  };

  return (
    <li className="flex flex-col bg-bay-floor transition-colors hover:bg-bay-wall">
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="flex items-center gap-2.5 font-display text-2xl font-medium">
            <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: platform.accent }} />
            {platform.name}
          </h3>
          <Pill dot={account ? "good" : "chalk"} className="shrink-0">
            {account ? "Connected (demo)" : "Not connected"}
          </Pill>
        </div>
        <p className="mt-3 font-body text-sm leading-6 text-chalk/60">{platform.blurb}</p>
        {account ? (
          <p className="mt-2 font-mono text-[11px] text-chalk/60">
            {account.accountName} · {account.accountId}
          </p>
        ) : null}
      </div>
      <div className="flex-1 px-6 pb-4">
        <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/50">What an integration may do</p>
        <ul className="mt-3 flex flex-col gap-3">
          {platform.capabilities.map((c) => (
            <li key={c.label}>
              <div className="flex items-center justify-between gap-2">
                <span className="font-body text-sm text-chalk">{c.label}</span>
                <Pill dot={LEVEL[c.level].dot} className="shrink-0">
                  {LEVEL[c.level].label}
                </Pill>
              </div>
              <p className="mt-1 font-body text-xs leading-5 text-chalk/55">{c.note}</p>
            </li>
          ))}
        </ul>
        <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/50">Needed before launch</p>
        <ul className="mt-2 list-disc pl-5 font-body text-xs leading-5 text-chalk/60 marker:text-hazard">
          {platform.prerequisites.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
      <div className="flex flex-wrap gap-2 p-6 pt-2">
        {account ? (
          <Button size="sm" variant="ghost" onClick={disconnect} disabled={busy}>
            {busy ? "Disconnecting…" : "Disconnect"}
          </Button>
        ) : (
          <Button size="sm" onClick={() => onConnect(platform)}>
            Connect (demo)
          </Button>
        )}
        <ButtonLink href={platform.dashboardUrl} external size="sm" variant="ghost">
          {platform.dashboardLabel} <Icon name="external" size={12} />
        </ButtonLink>
      </div>
    </li>
  );
}

function CampaignList() {
  const campaigns = useCampaigns();
  const now = useNow(1000);

  return (
    <div className="overflow-x-auto border-y border-white/15">
      <table className="w-full min-w-[720px] text-left">
        <caption className="sr-only">Campaigns and their status</caption>
        <thead>
          <tr className="border-b border-white/15 font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/50">
            <th scope="col" className="px-4 py-3 font-normal">Campaign</th>
            <th scope="col" className="px-4 py-3 font-normal">Platform</th>
            <th scope="col" className="px-4 py-3 font-normal">Budget</th>
            <th scope="col" className="px-4 py-3 font-normal">Dates</th>
            <th scope="col" className="px-4 py-3 font-normal">Status</th>
          </tr>
        </thead>
        <tbody>
          {campaigns.map((c) => {
            const status = STATUS[deriveStatus(c, now || Date.parse(c.submittedAt ?? "2026-01-01"))];
            const platform = PLATFORMS.find((p) => p.id === c.platformId);
            return (
              <tr key={c.id} className="border-b border-white/10 transition-colors last:border-0 hover:bg-white/[0.03]">
                <td className="px-4 py-3">
                  <p className="font-body text-sm text-chalk">{c.name}</p>
                  <p className="font-body text-xs text-chalk/50">
                    {c.designName}
                    {c.simulated ? <Pill outline className="ml-2 !py-0.5">Simulated</Pill> : null}
                  </p>
                </td>
                <td className="px-4 py-3 font-body text-sm text-chalk/80">{platform?.name}</td>
                <td className="px-4 py-3 font-mono text-xs text-chalk/80">${c.dailyBudget}/day</td>
                <td className="px-4 py-3 font-mono text-xs text-chalk/70">
                  {c.startDate} → {c.endDate}
                </td>
                <td className="px-4 py-3">
                  <span role="status">
                    <Pill dot={status.dot}>{status.label}</Pill>
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function IntegrationsView({ initialDesignId, initialPlatformId }: { initialDesignId: string | null; initialPlatformId: PlatformId | null }) {
  const [connecting, setConnecting] = useState<Platform | null>(null);

  return (
    <div className="mx-auto max-w-[1800px] px-4 pb-8 pt-10 sm:px-6">
      <PageHeader eyebrow="Integrations · 4 platforms" title="Integrations">
        Where Ads Garage is headed: build an ad, connect an advertising account, validate, review and submit. This page
        demonstrates the whole journey with mock data.
      </PageHeader>

      <div className="flex gap-3 rounded-xl bg-white/[0.06] p-5" role="note">
        <Icon name="info" size={18} className="mt-0.5 shrink-0 text-hazard" />
        <p className="font-body text-sm leading-6 text-chalk/75">
          <strong className="font-semibold text-chalk">Demo preview of a Pro workflow.</strong> No account is contacted,
          no OAuth happens and no campaign is created. Each platform decides what third-party apps may publish, so the
          capability labels below are working assumptions to verify, not promises.
        </p>
      </div>

      <section className="mt-16" aria-labelledby="platforms-heading">
        <h2 id="platforms-heading" className="border-b border-white/15 pb-4 font-display text-3xl font-medium">
          Platforms
        </h2>
        <ul className="mt-px grid hairlines md:grid-cols-2 xl:grid-cols-4">
          {PLATFORMS.map((platform) => (
            <PlatformCard key={platform.id} platform={platform} onConnect={setConnecting} />
          ))}
        </ul>
        <p className="mt-3 font-body text-xs text-chalk/50">More platforms can be added once their developer APIs are reviewed.</p>
      </section>

      <section id="publish" className="mt-20 scroll-mt-24" aria-labelledby="publish-heading">
        <h2 id="publish-heading" className="font-display text-3xl font-medium">
          Prepare a campaign
        </h2>
        <p className="mb-5 mt-1 max-w-2xl font-body text-sm text-chalk/60">Choose a design, pick a connected platform, pass the checks and submit.</p>
        <PublishWizard initialDesignId={initialDesignId} initialPlatformId={initialPlatformId} />
      </section>

      <section id="campaigns" className="mt-20 scroll-mt-24" aria-labelledby="campaigns-heading">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="campaigns-heading" className="font-display text-3xl font-medium">
              Campaigns
            </h2>
            <p className="mt-1 max-w-2xl font-body text-sm text-chalk/60">
              Status as it will appear after publishing. Campaigns you submit here progress through review on a timer.
            </p>
          </div>
          <button type="button" onClick={() => integrationsService.reset()} className="font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/50 underline underline-offset-4 hover:text-hazard">
            Reset demo connections and campaigns
          </button>
        </div>
        <div className="mt-5">
          <CampaignList />
        </div>
      </section>

      <ConnectModal platform={connecting} onClose={() => setConnecting(null)} />
    </div>
  );
}
