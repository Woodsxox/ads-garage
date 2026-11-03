"use client";

import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { Modal } from "@/components/ui/Modal";
import { FeatureStatusTag } from "@/components/ui/StateBadge";
import { PLANS } from "@/lib/demo/plans";
import { PLATFORMS } from "@/lib/demo/platforms";
import type { Plan } from "@/lib/domain/types";
import { useDemoPlan } from "@/lib/services/hooks";
import { STORAGE_KEYS } from "@/lib/storage";
import { useStored } from "@/lib/use-stored";

const LEGEND = [
  { status: "available", text: "Works in this release." },
  { status: "preview", text: "The interface works with mock data. The real behaviour needs the backend phase." },
  { status: "planned", text: "Not built yet." },
] as const;

function PlanCard({ plan }: { plan: Plan }) {
  const [demoPlan, setDemoPlan] = useDemoPlan();
  const [joined, setJoined] = useStored<boolean>(STORAGE_KEYS.waitlist, false);
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const active = (plan.id === "starter" && demoPlan === "starter") || (plan.id === "pro" && demoPlan === "pro");

  return (
    <article className="flex flex-col bg-bay-floor" aria-labelledby={`plan-${plan.id}`}>
      <div className="p-7 pb-5">
        <div className="flex items-start justify-between gap-3">
          <h2 id={`plan-${plan.id}`} className="font-display text-4xl font-medium">
            {plan.name}
          </h2>
          {plan.comingSoon ? (
            <Pill dot="bad" className="shrink-0">
              Coming soon
            </Pill>
          ) : active ? (
            <Pill dot="good" className="shrink-0">
              Demo plan
            </Pill>
          ) : null}
        </div>
        <p className="mt-2 font-mono text-[11px] uppercase tracking-[0.04em] text-hazard">Pricing at launch</p>
        <p className="mt-4 font-body text-sm leading-6 text-chalk/60">{plan.tagline}</p>
      </div>

      <ul className="flex flex-1 flex-col gap-4 border-t border-white/10 p-7">
        {plan.features.map((feature) => (
          <li key={feature.label} className="flex flex-col gap-1.5">
            <div className="flex items-start justify-between gap-3">
              <span className={`font-body text-sm leading-5 ${feature.status === "planned" ? "text-chalk/55" : "text-chalk"}`}>{feature.label}</span>
              <FeatureStatusTag status={feature.status} />
            </div>
            {feature.note ? <p className="font-body text-xs leading-5 text-chalk/45">{feature.note}</p> : null}
          </li>
        ))}
      </ul>

      {plan.id === "starter" ? (
        <div className="border-t border-white/10 px-7 pt-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/50">Finish setup in the platform</p>
          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
            {PLATFORMS.map((p) => (
              <li key={p.id}>
                <a href={p.dashboardUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-body text-sm text-chalk/80 underline-offset-2 hover:text-hazard hover:underline">
                  {p.name} <Icon name="external" size={11} />
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3 font-body text-xs leading-5 text-chalk/45">Starter does not publish for you. Export, then complete the campaign yourself.</p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2 p-7">
        {plan.id === "starter" ? (
          <>
            <ButtonLink href="/create">Start creating</ButtonLink>
            {demoPlan !== "starter" ? (
              <Button variant="ghost" onClick={() => setDemoPlan("starter")}>
                Use Starter in demo
              </Button>
            ) : null}
          </>
        ) : null}
        {plan.id === "pro" ? (
          <>
            {demoPlan === "pro" ? (
              <>
                <Button variant="ghost" onClick={() => setDemoPlan("starter")}>
                  Back to Starter demo
                </Button>
                <ButtonLink href="/integrations" variant="secondary">
                  See the integrations preview
                </ButtonLink>
              </>
            ) : (
              <Button onClick={() => setDemoPlan("pro")}>Try Pro in the demo</Button>
            )}
          </>
        ) : null}
        {plan.comingSoon ? (
          <>
            <Button disabled aria-disabled="true">
              Coming soon
            </Button>
            <Button variant="ghost" onClick={() => setWaitlistOpen(true)}>
              {joined ? "On the demo waitlist" : "Join waitlist (demo)"}
            </Button>
          </>
        ) : null}
      </div>

      <Modal open={waitlistOpen} onClose={() => setWaitlistOpen(false)} title="Ultra waitlist" size="sm">
        <p className="font-body text-sm leading-6 text-chalk/75">
          Ultra depends on AI models and integrations that are not built or verified yet. This is a demo of the waitlist step:
          nothing is collected or sent anywhere.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setWaitlistOpen(false)}>
            Close
          </Button>
          <Button
            onClick={() => {
              setJoined(!joined);
              setWaitlistOpen(false);
            }}
          >
            {joined ? "Leave waitlist" : "Join (demo)"}
          </Button>
        </div>
      </Modal>
    </article>
  );
}

export function PlansView() {
  const [demoPlan] = useDemoPlan();
  return (
    <div className="mx-auto max-w-[1800px] px-4 pb-8 pt-10 sm:px-6">
      <PageHeader eyebrow="Plans · Starter, Pro, Ultra" title="Plans">
        Starter is about learning, creating and exporting, then publishing yourself. Pro adds more AI and a connected
        publishing workflow. Ultra is the most advanced tier, once its models and integrations are built and verified.
      </PageHeader>

      <ul className="grid hairlines md:grid-cols-3" aria-label="What the labels mean">
        {LEGEND.map((l) => (
          <li key={l.status} className="flex items-start gap-3 bg-bay-floor p-5">
            <FeatureStatusTag status={l.status} />
            <p className="font-body text-xs leading-5 text-chalk/60">{l.text}</p>
          </li>
        ))}
      </ul>

      <div className="mt-px flex items-start gap-3 bg-bay-floor p-5" role="note">
        <Icon name="info" size={16} className="mt-0.5 shrink-0 text-hazard" />
        <p className="font-body text-xs leading-5 text-chalk/60">
          Nothing here takes payment. The demo switch only unlocks interface features so you can review them. Current demo plan:{" "}
          <strong className="text-chalk">{demoPlan === "pro" ? "Pro" : "Starter"}</strong>.
        </p>
      </div>

      <div className="mt-px flex items-start gap-3 bg-bay-floor p-5" role="note">
        <Icon name="info" size={16} className="mt-0.5 shrink-0 text-hazard" />
        <p className="font-body text-xs leading-5 text-chalk/60">
          Browsing Ads Garage is free. The site is supported by clearly labelled advertising and by these plans, and the
          two are separate. Any fees from publishers or ad networks you publish through will be shown on their own,
          never folded into a plan price.
        </p>
      </div>

      <div className="mt-16 grid items-stretch hairlines lg:grid-cols-3">
        {PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </div>
    </div>
  );
}
