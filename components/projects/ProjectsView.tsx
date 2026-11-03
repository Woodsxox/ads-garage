"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DesignCanvas } from "@/components/studio/DesignCanvas";
import { ExportModal } from "@/components/studio/ExportModal";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { TILE_GRID } from "@/components/ui/tile";
import { useProjects } from "@/lib/services/hooks";
import { projectsService } from "@/lib/services";
import type { AdDesign } from "@/lib/studio/model";

const DATE = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });

type Sort = "recent" | "name";
type StatusFilter = "all" | AdDesign["status"];

const chip = (selected: boolean) =>
  `rounded-full border px-4 py-2 font-mono text-[11px] uppercase tracking-[0.04em] transition-colors ${
    selected ? "border-chalk bg-chalk text-bay-floor" : "border-white/20 text-chalk/80 hover:border-chalk/60"
  }`;

export function ProjectsView() {
  const projects = useProjects();
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("recent");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [exporting, setExporting] = useState<AdDesign | null>(null);
  const [deleting, setDeleting] = useState<AdDesign | null>(null);
  const [resetting, setResetting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const visible = useMemo(() => {
    const term = q.trim().toLowerCase();
    return projects
      .filter((p) => (status === "all" || p.status === status) && (!term || p.name.toLowerCase().includes(term)))
      .sort((a, b) => (sort === "name" ? a.name.localeCompare(b.name) : b.updatedAt.localeCompare(a.updatedAt)));
  }, [projects, q, sort, status]);

  const duplicate = (p: AdDesign) => {
    const copy = projectsService.duplicate(p.id);
    setNotice(copy ? `Duplicated as “${copy.name}”.` : "Could not duplicate that design.");
  };

  const confirmDelete = () => {
    if (!deleting) return;
    projectsService.remove(deleting.id);
    setNotice(`Deleted “${deleting.name}”.`);
    setDeleting(null);
  };

  return (
    <div className="mx-auto max-w-[1800px] px-4 pb-8 pt-10 sm:px-6">
      <PageHeader
        eyebrow={`My ads · ${projects.length} ${projects.length === 1 ? "design" : "designs"}`}
        title="My ads"
        actions={
          <ButtonLink href="/create">
            <Icon name="plus" size={14} /> New ad
          </ButtonLink>
        }
      >
        Saved designs live in this browser during the demo. Account-synced projects arrive with the backend.
      </PageHeader>

      <div className="flex flex-col gap-3 border-y border-white/10 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by status">
          {(["all", "draft", "ready"] as const).map((s) => (
            <button key={s} type="button" aria-pressed={status === s} onClick={() => setStatus(s)} className={chip(status === s)}>
              {s === "all" ? "All" : s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="relative block sm:w-64">
            <span className="sr-only">Search designs</span>
            <Icon name="search" size={15} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-chalk/50" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search designs"
              className="w-full rounded-full border border-white/15 bg-bay-floor py-2.5 pl-10 pr-4 font-body text-sm text-chalk placeholder:text-chalk/40"
            />
          </label>
          <label className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/60">
            Sort
            <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="rounded-full border border-white/15 bg-bay-floor px-4 py-2 font-body text-sm normal-case tracking-normal text-chalk">
              <option value="recent">Recently edited</option>
              <option value="name">Name</option>
            </select>
          </label>
        </div>
      </div>

      <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/60" role="status" aria-live="polite">
        {notice ?? `${visible.length} of ${projects.length} design${projects.length === 1 ? "" : "s"}`}
      </p>

      {visible.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-white/20 p-12 text-center">
          <p className="font-display text-xl tracking-[0.04em]">{projects.length === 0 ? "No designs yet" : "No matches"}</p>
          <p className="mt-2 font-body text-sm text-chalk/65">
            {projects.length === 0 ? "Start from a template and save it here." : "Try a different search or filter."}
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <ButtonLink href="/create">Start a new ad</ButtonLink>
            {projects.length === 0 ? (
              <Button variant="ghost" onClick={() => projectsService.reset()}>
                Restore demo projects
              </Button>
            ) : null}
          </div>
        </div>
      ) : (
        <ul className={`${TILE_GRID} mt-4 grid-cols-[minmax(0,1fr)] sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4`}>
          {visible.map((p) => {
            const scale = Math.min(300 / p.width, 190 / p.height);
            return (
              <li key={p.id} className="flex min-w-0 flex-col bg-bay-floor transition-colors hover:bg-bay-wall">
                <div className="grid h-[240px] place-items-center p-5">
                  <DesignCanvas design={p} scale={scale} />
                </div>
                <div className="flex flex-1 flex-col gap-2 p-5 pt-0">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="truncate font-display text-xl font-medium">
                      <Link href={`/create?project=${p.id}`} className="hover:text-hazard">
                        {p.name}
                      </Link>
                    </h2>
                    <Pill dot={p.status === "ready" ? "good" : "chalk"} className="shrink-0">
                      {p.status}
                    </Pill>
                  </div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/50">
                    {p.width}×{p.height} · edited {DATE.format(new Date(p.updatedAt))}
                  </p>
                  <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
                    <ButtonLink href={`/create?project=${p.id}`} size="sm">
                      Edit
                    </ButtonLink>
                    <Button size="sm" variant="ghost" onClick={() => setExporting(p)} aria-label={`Export ${p.name}`}>
                      <Icon name="download" size={12} /> Export
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => duplicate(p)} aria-label={`Duplicate ${p.name}`}>
                      <Icon name="copy" size={12} />
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleting(p)} aria-label={`Delete ${p.name}`}>
                      <Icon name="trash" size={12} />
                    </Button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-10 border-t border-white/10 pt-4">
        <button type="button" onClick={() => setResetting(true)} className="font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/50 underline underline-offset-4 hover:text-hazard">
          Reset demo projects
        </button>
      </div>

      {exporting ? <ExportModal design={exporting} open onClose={() => setExporting(null)} /> : null}

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Delete this design?" size="sm">
        <p className="font-body text-sm leading-6 text-chalk/75">
          “{deleting?.name}” will be removed from this browser. This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setDeleting(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={confirmDelete}>
            Delete
          </Button>
        </div>
      </Modal>

      <Modal open={resetting} onClose={() => setResetting(false)} title="Reset demo projects?" size="sm">
        <p className="font-body text-sm leading-6 text-chalk/75">
          This replaces everything on this page with the original demo designs. Your own designs will be removed.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => setResetting(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => {
              projectsService.reset();
              setResetting(false);
              setNotice("Demo projects restored.");
            }}
          >
            Reset
          </Button>
        </div>
      </Modal>
    </div>
  );
}
