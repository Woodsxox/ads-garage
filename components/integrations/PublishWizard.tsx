"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ConnectModal } from "@/components/integrations/ConnectModal";
import { DesignCanvas } from "@/components/studio/DesignCanvas";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PLATFORMS, getPlatform } from "@/lib/demo/platforms";
import type { Campaign, CheckResult, Platform, PlatformId } from "@/lib/domain/types";
import { integrationsService } from "@/lib/services";
import { useAccounts, useProjects } from "@/lib/services/hooks";
import { summarize, validateForPlatform } from "@/lib/studio/validate";

const STEPS = ["Design", "Platform", "Checks", "Campaign", "Review"] as const;

type Form = {
  name: string;
  objective: Campaign["objective"];
  dailyBudget: number;
  startDate: string;
  endDate: string;
  audience: string;
};

const DEFAULT_FORM: Form = {
  name: "",
  objective: "traffic",
  dailyBudget: 10,
  startDate: "2026-11-01",
  endDate: "2026-11-30",
  audience: "Home workshop owners, 25–54",
};

const STATUS_ICON = { pass: ["check", "text-torque"], warn: ["alert", "text-hazard"], fail: ["x", "text-flag"] } as const;

const INPUT = "w-full border border-white/15 bg-bay-floor px-3 py-2 font-body text-sm text-chalk";

export function PublishWizard({ initialDesignId, initialPlatformId }: { initialDesignId: string | null; initialPlatformId: PlatformId | null }) {
  const projects = useProjects();
  const accounts = useAccounts();
  const [step, setStep] = useState(initialDesignId ? 1 : 0);
  const [designId, setDesignId] = useState<string | null>(initialDesignId);
  const [platformId, setPlatformId] = useState<PlatformId | null>(initialPlatformId);
  const [form, setForm] = useState<Form>(DEFAULT_FORM);
  const [connecting, setConnecting] = useState<Platform | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<Campaign | null>(null);

  const design = projects.find((p) => p.id === designId) ?? null;
  const platform = platformId ? (getPlatform(platformId) ?? null) : null;
  const connected = platform ? accounts.some((a) => a.platformId === platform.id) : false;

  const checks: CheckResult[] = useMemo(
    () => (design && platform ? validateForPlatform(design, platform) : []),
    [design, platform],
  );
  const summary = summarize(checks);

  const nameValue = form.name || (design && platform ? `${design.name} · ${platform.name}` : "");
  const formProblem =
    form.dailyBudget < 1
      ? "Daily budget must be at least 1."
      : form.endDate < form.startDate
        ? "The end date must be on or after the start date."
        : nameValue.trim() === ""
          ? "Give the campaign a name."
          : null;

  const canNext = [
    design !== null,
    platform !== null && connected,
    summary.fail === 0,
    formProblem === null,
    false,
  ][step];

  const submit = async () => {
    if (!design || !platform) return;
    setSubmitting(true);
    setError(null);
    try {
      const campaign = await integrationsService.submitCampaign({ design, platformId: platform.id, ...form, name: nameValue });
      setSubmitted(campaign);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
    } finally {
      setSubmitting(false);
    }
  };

  const startOver = () => {
    setSubmitted(null);
    setStep(0);
    setDesignId(null);
    setPlatformId(null);
    setForm(DEFAULT_FORM);
  };

  if (submitted) {
    return (
      <div className="border border-torque/60 bg-torque/10 p-6" role="status" aria-live="polite">
        <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.04em] text-torque">
          <Icon name="check" size={14} /> Submitted (simulated)
        </p>
        <h3 className="mt-2 font-display text-2xl tracking-[0.04em]">{submitted.name}</h3>
        <p className="mt-2 max-w-xl font-body text-sm leading-6 text-chalk/75">
          Nothing was sent to {platform?.name}. Watch the status change in the list below: it moves through review
          on a timer, to show how real status tracking will look.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <ButtonLink href="#campaigns" variant="secondary">
            See campaign status
          </ButtonLink>
          <Button variant="ghost" onClick={startOver}>
            Prepare another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-bay-wall">
      <ol className="flex flex-wrap border-b border-white/10" aria-label="Workflow steps">
        {STEPS.map((label, i) => (
          <li key={label} className="flex-1" aria-current={i === step ? "step" : undefined}>
            <button
              type="button"
              disabled={i > step}
              onClick={() => setStep(i)}
              className={`flex w-full items-center gap-2 border-b-2 px-3 py-3 text-left font-mono text-[11px] uppercase tracking-[0.04em] disabled:cursor-not-allowed ${
                i === step ? "border-hazard text-hazard" : i < step ? "border-torque/60 text-torque" : "border-transparent text-chalk/40"
              }`}
            >
              <span className="grid h-5 w-5 place-items-center border border-current text-[10px]">{i < step ? <Icon name="check" size={11} /> : i + 1}</span>
              <span className="hidden sm:inline">{label}</span>
            </button>
          </li>
        ))}
      </ol>

      <div className="p-5 sm:p-6">
        {step === 0 ? (
          <div>
            <h3 className="font-display text-lg tracking-[0.04em]">Choose a design</h3>
            {projects.length === 0 ? (
              <p className="mt-3 font-body text-sm text-chalk/65">
                You have no saved designs. <Link href="/create" className="text-hazard underline">Create one</Link> first.
              </p>
            ) : (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {projects.map((p) => {
                  const selected = p.id === designId;
                  return (
                    <li key={p.id}>
                      <button
                        type="button"
                        aria-pressed={selected}
                        onClick={() => setDesignId(p.id)}
                        className={`flex w-full items-center gap-3 border p-2.5 text-left transition-colors ${selected ? "border-hazard bg-hazard/10" : "border-white/15 hover:border-chalk/50"}`}
                      >
                        <span className="grid h-[64px] w-[84px] shrink-0 place-items-center bg-bay-floor">
                          <DesignCanvas design={p} scale={Math.min(80 / p.width, 60 / p.height)} />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-body text-sm text-chalk">{p.name}</span>
                          <span className="block font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/50">
                            {p.width}×{p.height}
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        ) : null}

        {step === 1 ? (
          <div>
            <h3 className="font-display text-lg tracking-[0.04em]">Choose a platform</h3>
            <p className="mt-1 font-body text-sm text-chalk/60">Only connected platforms can be selected. Connections are simulated.</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {PLATFORMS.map((p) => {
                const isConnected = accounts.some((a) => a.platformId === p.id);
                const selected = p.id === platformId;
                return (
                  <li key={p.id} className={`flex items-center justify-between gap-3 border p-3 ${selected ? "border-hazard bg-hazard/10" : "border-white/15"}`}>
                    <span>
                      <span className="block font-body text-sm text-chalk">{p.name}</span>
                      <span className={`font-mono text-[10px] uppercase tracking-[0.04em] ${isConnected ? "text-torque" : "text-chalk/50"}`}>
                        {isConnected ? "Connected (demo)" : "Not connected"}
                      </span>
                    </span>
                    {isConnected ? (
                      <Button size="sm" variant={selected ? "primary" : "ghost"} aria-pressed={selected} onClick={() => setPlatformId(p.id)}>
                        {selected ? "Selected" : "Select"}
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => setConnecting(p)}>
                        Connect
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}

        {step === 2 && design && platform ? (
          <div>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-display text-lg tracking-[0.04em]">
                Checks for {platform.name}
              </h3>
              <p className="font-mono text-[11px] text-chalk/60" role="status">
                {summary.pass} pass · {summary.warn} warn · {summary.fail} fail
              </p>
            </div>
            <ul className="mt-3 flex flex-col gap-1.5">
              {checks.map((r) => {
                const [icon, cls] = STATUS_ICON[r.status];
                return (
                  <li key={r.id} className="flex gap-2.5 border border-white/10 p-2.5">
                    <Icon name={icon} size={15} className={`mt-0.5 shrink-0 ${cls}`} />
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
            {summary.fail > 0 ? (
              <p className="mt-3 font-body text-sm text-flag" role="alert">
                Fix the failed checks to continue. <Link href={`/create?project=${design.id}`} className="underline">Edit this design</Link>
              </p>
            ) : (
              <p className="mt-3 font-body text-xs text-chalk/50">Warnings do not block the demo, but a real platform may reject them.</p>
            )}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <h3 className="font-display text-lg tracking-[0.04em] sm:col-span-2">Campaign details</h3>
            <label className="block sm:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/55">Campaign name</span>
              <input className={`${INPUT} mt-1`} value={nameValue} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/55">Objective</span>
              <select className={`${INPUT} mt-1`} value={form.objective} onChange={(e) => setForm({ ...form, objective: e.target.value as Form["objective"] })}>
                <option value="traffic">Traffic</option>
                <option value="awareness">Awareness</option>
                <option value="conversions">Conversions</option>
              </select>
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/55">Daily budget (USD, mock)</span>
              <input type="number" min={1} className={`${INPUT} mt-1`} value={form.dailyBudget} onChange={(e) => setForm({ ...form, dailyBudget: Number(e.target.value) })} />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/55">Start date</span>
              <input type="date" className={`${INPUT} mt-1`} value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
            </label>
            <label className="block">
              <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/55">End date</span>
              <input type="date" className={`${INPUT} mt-1`} value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
            </label>
            <label className="block sm:col-span-2">
              <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/55">Audience (description only)</span>
              <input className={`${INPUT} mt-1`} value={form.audience} onChange={(e) => setForm({ ...form, audience: e.target.value })} />
            </label>
            {formProblem ? (
              <p role="alert" className="font-body text-sm text-flag sm:col-span-2">
                {formProblem}
              </p>
            ) : null}
          </div>
        ) : null}

        {step === 4 && design && platform ? (
          <div>
            <h3 className="font-display text-lg tracking-[0.04em]">Review and submit</h3>
            <dl className="mt-4 grid grid-cols-[130px_1fr] gap-x-4 gap-y-2 font-body text-sm">
              {[
                ["Campaign", nameValue],
                ["Platform", `${platform.name} (demo account)`],
                ["Design", `${design.name} · ${design.width}×${design.height}`],
                ["Objective", form.objective],
                ["Budget", `$${form.dailyBudget}/day (mock)`],
                ["Dates", `${form.startDate} → ${form.endDate}`],
                ["Audience", form.audience || "—"],
              ].map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/50">{k}</dt>
                  <dd className="text-chalk/85">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 border-l-2 border-hazard pl-3 font-body text-xs leading-5 text-chalk/60">
              Submitting here creates a simulated campaign only. Real publishing needs approved API access and the
              user&apos;s authorization, and depends on what each platform allows third-party apps to do.
            </p>
            {error ? (
              <p role="alert" className="mt-3 font-body text-sm text-flag">
                {error}
              </p>
            ) : null}
            <Button className="mt-4" onClick={submit} disabled={submitting}>
              {submitting ? "Submitting…" : "Submit campaign (simulated)"}
            </Button>
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
          <Button variant="ghost" disabled={step === 0 || submitting} onClick={() => setStep(step - 1)}>
            <Icon name="arrowLeft" size={14} /> Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button disabled={!canNext} onClick={() => setStep(step + 1)}>
              Next <Icon name="arrowRight" size={14} />
            </Button>
          ) : null}
        </div>
      </div>

      <ConnectModal platform={connecting} onClose={() => setConnecting(null)} onConnected={(id) => setPlatformId(id)} />
    </div>
  );
}
