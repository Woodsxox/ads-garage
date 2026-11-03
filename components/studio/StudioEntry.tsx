"use client";

import { useState } from "react";
import { Studio } from "@/components/studio/Studio";
import { TemplatePicker } from "@/components/studio/TemplatePicker";
import { ButtonLink } from "@/components/ui/Button";
import { type StudioTemplate, getTemplate, instantiateTemplate } from "@/lib/demo/templates";
import { useHydrated, useProjects } from "@/lib/services/hooks";
import { type AdDesign, newDesignId } from "@/lib/studio/model";

function Skeleton() {
  return (
    <div className="mx-auto max-w-[1200px] px-4 py-16 sm:px-6" aria-busy="true">
      <p className="font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/50">Opening the studio…</p>
    </div>
  );
}

/**
 * Decides what the studio shows: a saved project (?project=), a fresh design from a template
 * (?template=, with an id minted on the server so markup agrees), or the template picker.
 * Saved projects live in browser storage, so nothing is decided until after hydration.
 */
export function StudioEntry({
  projectId,
  templateId,
  fresh,
}: {
  projectId: string | null;
  templateId: string | null;
  fresh: { id: string; now: string };
}) {
  const hydrated = useHydrated();
  if (!hydrated) return <Skeleton />;
  return <Gate projectId={projectId} templateId={templateId} fresh={fresh} />;
}

function Gate({ projectId, templateId, fresh }: { projectId: string | null; templateId: string | null; fresh: { id: string; now: string } }) {
  const projects = useProjects();
  const [picked, setPicked] = useState<AdDesign | null>(null);

  if (projectId) {
    const project = projects.find((p) => p.id === projectId);
    if (!project) {
      return (
        <div className="mx-auto max-w-lg px-4 py-16 sm:px-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-flag">Not found</p>
          <h1 className="mt-2 font-display text-3xl tracking-[0.04em]">That design is not in this browser</h1>
          <p className="mt-3 font-body text-sm leading-6 text-chalk/70">
            Designs are saved locally in the demo, so a link only works in the browser that saved it.
          </p>
          <div className="mt-5 flex gap-3">
            <ButtonLink href="/projects">My ads</ButtonLink>
            <ButtonLink href="/create" variant="ghost">
              Start a new ad
            </ButtonLink>
          </div>
        </div>
      );
    }
    return <Studio key={project.id} initial={project} persisted />;
  }

  if (picked) return <Studio key={picked.id} initial={picked} persisted={false} />;

  const fromUrl = templateId ? getTemplate(templateId) : undefined;
  if (fromUrl) {
    return <Studio key={fresh.id} initial={instantiateTemplate(fromUrl, fresh)} persisted={false} />;
  }

  const pick = (template: StudioTemplate) =>
    setPicked(instantiateTemplate(template, { id: newDesignId(), now: new Date().toISOString() }));

  return <TemplatePicker onPick={pick} />;
}
