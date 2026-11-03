"use client";

import { DesignCanvas } from "@/components/studio/DesignCanvas";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { TILE_GRID } from "@/components/ui/tile";
import { TEMPLATES, type StudioTemplate, instantiateTemplate } from "@/lib/demo/templates";
import { useDemoPlan } from "@/lib/services/hooks";

const PREVIEW_NOW = "2026-01-01T00:00:00.000Z";
const BOX = { w: 280, h: 190 };

function Thumb({ template }: { template: StudioTemplate }) {
  const design = instantiateTemplate(template, { id: `preview-${template.id}`, now: PREVIEW_NOW });
  const scale = Math.min(BOX.w / design.width, BOX.h / design.height);
  return (
    <div className="grid h-[240px] place-items-center p-4">
      <DesignCanvas design={design} scale={scale} />
    </div>
  );
}

export function TemplatePicker({ onPick }: { onPick: (template: StudioTemplate) => void }) {
  const [plan, setPlan] = useDemoPlan();
  const pro = plan === "pro";

  return (
    <div className="mx-auto max-w-[1800px] px-4 pb-8 pt-10 sm:px-6">
      <PageHeader
        eyebrow={`Create · ${TEMPLATES.length} templates`}
        title="Start a new ad"
        actions={
          <ButtonLink href="/projects" variant="ghost">
            Open a saved design
          </ButtonLink>
        }
      >
        Pick a template. Everything is editable: text, images, buttons, colors and size. Designs save to this browser
        and export as PNG, HTML, JSON or code.
      </PageHeader>

      <p className="mb-6 font-body text-xs text-chalk/55">
        {!pro ? (
          <>
            Templates marked Pro are previewed with the demo plan switch.{" "}
            <button type="button" onClick={() => setPlan("pro")} className="text-hazard underline underline-offset-2">
              Switch demo plan to Pro
            </button>
          </>
        ) : (
          <span className="font-mono text-[11px] uppercase tracking-[0.04em] text-torque">
            Demo plan: Pro ·{" "}
            <button type="button" onClick={() => setPlan("starter")} className="underline underline-offset-2">
              back to Starter
            </button>
          </span>
        )}
      </p>

      <ul className={`${TILE_GRID} sm:grid-cols-2 lg:grid-cols-3`}>
        {TEMPLATES.map((template) => {
          const locked = template.pro && !pro;
          return (
            <li key={template.id} className="flex flex-col bg-bay-floor transition-colors hover:bg-bay-wall">
              <div className={locked ? "opacity-40" : ""}>
                <Thumb template={template} />
              </div>
              <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-start justify-between gap-3">
                  <h2 className="font-display text-2xl font-medium leading-tight">{template.name}</h2>
                  {template.pro ? (
                    <Pill dot="accent" className="shrink-0">
                      <Icon name={locked ? "lock" : "zap"} size={10} /> Pro
                    </Pill>
                  ) : null}
                </div>
                <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/50">{template.formatId.replace("x", "×")}</p>
                <p className="font-body text-sm leading-6 text-chalk/60">{template.description}</p>
                <div className="mt-auto pt-3">
                  {locked ? (
                    <Button variant="ghost" size="sm" onClick={() => setPlan("pro")}>
                      <Icon name="lock" size={12} /> Unlock in demo
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => onPick(template)}>
                      Use template <Icon name="arrowRight" size={13} />
                    </Button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
