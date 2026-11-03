"use client";

import { useEffect, useRef, useState } from "react";
import { useTransitionRouter } from "@/components/chrome/PageTransition";
import { DesignCanvas } from "@/components/studio/DesignCanvas";
import { ExportModal } from "@/components/studio/ExportModal";
import { Inspector } from "@/components/studio/Inspector";
import { PrepareModal } from "@/components/studio/PrepareModal";
import { PreviewModal } from "@/components/studio/PreviewModal";
import { useDesignHistory } from "@/components/studio/use-design-history";
import { Button } from "@/components/ui/Button";
import { Icon, type IconName } from "@/components/ui/Icon";
import type { PlatformId } from "@/lib/domain/types";
import { useDemoPlan } from "@/lib/services/hooks";
import { projectsService } from "@/lib/services";
import {
  type AdDesign,
  type Background,
  type DesignElement,
  type ElementType,
  STUDIO_FORMATS,
  getStudioFormat,
  makeElement,
  newElementId,
} from "@/lib/studio/model";

const ADD: { type: ElementType; label: string; icon: IconName }[] = [
  { type: "text", label: "Text", icon: "type" },
  { type: "image", label: "Image", icon: "image" },
  { type: "button", label: "Button", icon: "pointer" },
  { type: "shape", label: "Shape", icon: "square" },
];

const TYPE_ICON: Record<ElementType, IconName> = { text: "type", image: "image", button: "pointer", shape: "square" };
const ZOOMS = [0.5, 1, 2] as const;

function useContainerWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return [ref, width] as const;
}

export function Studio({ initial, persisted }: { initial: AdDesign; persisted: boolean }) {
  const router = useTransitionRouter();
  const [plan] = useDemoPlan();
  const history = useDesignHistory(initial);
  const { design, change, commit, undo, redo, markSaved, canUndo, canRedo, dirty } = history;

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState<"fit" | number>("fit");
  const [grid, setGrid] = useState(false);
  const [modal, setModal] = useState<null | "preview" | "export" | "prepare">(null);
  const [saveLabel, setSaveLabel] = useState<string | null>(null);
  const [saveWarning, setSaveWarning] = useState(false);
  const [canvasRef, canvasWidth] = useContainerWidth();
  const lastEdit = useRef({ key: "", at: 0 });

  const selected = design.elements.find((e) => e.id === selectedId) ?? null;
  const pro = plan === "pro";

  const fit = canvasWidth > 0 ? Math.min(3, (canvasWidth - 32) / design.width, 560 / design.height) : 1;
  const scale = zoom === "fit" ? Math.max(0.05, fit) : zoom;

  /** Rapid edits to the same field (typing, dragging a slider) collapse into one undo step. */
  const edit = (next: AdDesign, key: string) => {
    const now = Date.now();
    const same = lastEdit.current.key === key && now - lastEdit.current.at < 900;
    lastEdit.current = { key, at: now };
    change(next, !same);
  };

  const patchElement = (patch: Partial<DesignElement>) => {
    if (!selected) return;
    edit(
      { ...design, elements: design.elements.map((e) => (e.id === selected.id ? ({ ...e, ...patch } as DesignElement) : e)) },
      `${selected.id}:${Object.keys(patch).join(",")}`,
    );
  };

  const patchBackground = (patch: Partial<Background>) =>
    edit({ ...design, background: { ...design.background, ...patch } }, `bg:${Object.keys(patch).join(",")}`);

  const addElement = (type: ElementType) => {
    const element = makeElement(type, newElementId(), design);
    change({ ...design, elements: [...design.elements, element] });
    setSelectedId(element.id);
  };

  const removeSelected = () => {
    if (!selected) return;
    change({ ...design, elements: design.elements.filter((e) => e.id !== selected.id) });
    setSelectedId(null);
  };

  const duplicateSelected = () => {
    if (!selected) return;
    const copy = { ...selected, id: newElementId(), name: `${selected.name} copy`, x: selected.x + 12, y: selected.y + 12 } as DesignElement;
    change({ ...design, elements: [...design.elements, copy] });
    setSelectedId(copy.id);
  };

  const reorder = (delta: 1 | -1) => {
    if (!selected) return;
    const i = design.elements.findIndex((e) => e.id === selected.id);
    const j = i + delta;
    if (j < 0 || j >= design.elements.length) return;
    const elements = [...design.elements];
    [elements[i], elements[j]] = [elements[j], elements[i]];
    change({ ...design, elements });
  };

  const changeFormat = (formatId: string) => {
    const format = getStudioFormat(formatId);
    const sx = format.width / design.width;
    const sy = format.height / design.height;
    const fs = Math.min(sx, sy);
    change({
      ...design,
      formatId: format.id,
      width: format.width,
      height: format.height,
      elements: design.elements.map((e) => {
        const base = { ...e, x: Math.round(e.x * sx), y: Math.round(e.y * sy), w: Math.round(e.w * sx), h: Math.round(e.h * sy) };
        if (e.type === "text" || e.type === "button") return { ...base, fontSize: Math.max(6, Math.round(e.fontSize * fs)) } as DesignElement;
        return base as DesignElement;
      }),
    });
  };

  const save = () => {
    const durable = projectsService.save(design);
    markSaved();
    setSaveWarning(!durable);
    setSaveLabel(`Saved ${new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`);
    window.history.replaceState(null, "", `/create?project=${design.id}`);
    return durable;
  };

  const openWorkflow = (platformId: PlatformId) => {
    save();
    router.push(`/integrations?design=${design.id}&platform=${platformId}#publish`);
  };

  // Keyboard: handler is kept in a ref so the window listener is attached once.
  const keyHandler = useRef<(event: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    keyHandler.current = (event) => {
      const target = event.target as HTMLElement | null;
      const typing = target?.closest("input, textarea, select, dialog, [contenteditable='true']");
      const mod = event.metaKey || event.ctrlKey;
      if (mod && event.key.toLowerCase() === "s") {
        event.preventDefault();
        save();
        return;
      }
      if (typing) return;
      if (mod && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) redo();
        else undo();
        return;
      }
      if (!selected) return;
      const step = event.shiftKey ? 10 : 1;
      const move = (dx: number, dy: number) => {
        event.preventDefault();
        patchElement({ x: selected.x + dx, y: selected.y + dy });
      };
      if (event.key === "Delete" || event.key === "Backspace") {
        event.preventDefault();
        removeSelected();
      } else if (event.key === "ArrowLeft") move(-step, 0);
      else if (event.key === "ArrowRight") move(step, 0);
      else if (event.key === "ArrowUp") move(0, -step);
      else if (event.key === "ArrowDown") move(0, step);
    };
  });
  useEffect(() => {
    const listener = (event: KeyboardEvent) => keyHandler.current(event);
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, []);

  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const status = dirty ? "Unsaved changes" : (saveLabel ?? (persisted ? "Saved" : "Not saved yet"));
  const layers = [...design.elements].reverse();

  return (
    <div className="mx-auto max-w-[1600px] px-3 py-4 sm:px-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl bg-bay-wall p-2.5">
        <label className="min-w-[160px] flex-1 sm:max-w-xs">
          <span className="sr-only">Design name</span>
          <input
            value={design.name}
            onChange={(e) => edit({ ...design, name: e.target.value }, "name")}
            className="w-full border border-transparent bg-bay-floor px-2.5 py-1.5 font-display text-base tracking-[0.04em] text-chalk hover:border-white/20"
          />
        </label>
        <label className="flex items-center gap-1.5">
          <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/55">Size</span>
          <select
            value={design.formatId}
            onChange={(e) => changeFormat(e.target.value)}
            aria-label="Ad size"
            className="border border-white/15 bg-bay-floor px-2 py-1.5 font-body text-sm text-chalk"
          >
            {(["Display", "Social", "Video"] as const).map((group) => (
              <optgroup key={group} label={group}>
                {STUDIO_FORMATS.filter((f) => f.group === group).map((f) => (
                  <option key={f.id} value={f.id} disabled={f.pro && !pro && f.id !== design.formatId}>
                    {f.width}×{f.height} {f.label}
                    {f.pro && !pro ? " (Pro)" : ""}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-1.5">
          <span className="sr-only">Status</span>
          <select
            value={design.status}
            onChange={(e) => edit({ ...design, status: e.target.value as AdDesign["status"] }, "status")}
            aria-label="Design status"
            className="border border-white/15 bg-bay-floor px-2 py-1.5 font-body text-sm text-chalk"
          >
            <option value="draft">Draft</option>
            <option value="ready">Ready</option>
          </select>
        </label>

        <div className="ml-auto flex flex-wrap items-center gap-1.5">
          <button type="button" onClick={undo} disabled={!canUndo} aria-label="Undo" className="grid h-9 w-9 place-items-center border border-white/15 text-chalk hover:border-hazard disabled:opacity-30">
            <Icon name="undo" size={16} />
          </button>
          <button type="button" onClick={redo} disabled={!canRedo} aria-label="Redo" className="grid h-9 w-9 place-items-center border border-white/15 text-chalk hover:border-hazard disabled:opacity-30">
            <Icon name="redo" size={16} />
          </button>
          <Button variant="ghost" size="sm" onClick={() => router.push("/create")}>
            <Icon name="plus" size={13} /> New
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setModal("preview")}>
            <Icon name="eye" size={13} /> Preview
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setModal("export")}>
            <Icon name="download" size={13} /> Export
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setModal("prepare")}>
            <Icon name="external" size={13} /> Prepare for platform
          </Button>
          <Button size="sm" onClick={save}>
            <Icon name="save" size={13} /> Save
          </Button>
        </div>
      </div>
      <p
        className={`mt-2 font-mono text-[11px] uppercase tracking-[0.04em] ${dirty ? "text-hazard" : "text-chalk/55"}`}
        role="status"
        aria-live="polite"
      >
        {status}
        {saveWarning ? (
          <span className="ml-2 text-flag">
            · browser storage is full or unavailable: this save lives in memory only. Export your design to keep it.
          </span>
        ) : null}
      </p>

      <div className="mt-3 grid gap-3 lg:grid-cols-[230px_minmax(0,1fr)_300px]">
        {/* Elements */}
        <aside aria-label="Elements" className="rounded-xl bg-bay-wall p-3 lg:order-none">
          <h2 className="font-display text-sm tracking-[0.04em]">Add</h2>
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {ADD.map((a) => (
              <button
                key={a.type}
                type="button"
                onClick={() => addElement(a.type)}
                className="flex items-center justify-center gap-1.5 border border-white/15 px-2 py-2 font-mono text-[11px] uppercase tracking-[0.04em] text-chalk hover:border-hazard hover:text-hazard"
              >
                <Icon name={a.icon} size={13} /> {a.label}
              </button>
            ))}
          </div>
          <h2 className="mt-5 font-display text-sm tracking-[0.04em]">Layers</h2>
          <ul className="mt-2 flex max-h-72 flex-col gap-1 overflow-y-auto">
            {layers.length === 0 ? <li className="font-body text-xs text-chalk/50">Empty canvas. Add an element.</li> : null}
            {layers.map((el) => (
              <li key={el.id}>
                <button
                  type="button"
                  aria-pressed={el.id === selectedId}
                  onClick={() => setSelectedId(el.id)}
                  className={`flex w-full items-center gap-2 border px-2 py-1.5 text-left font-body text-sm ${
                    el.id === selectedId ? "border-hazard bg-hazard/10 text-chalk" : "border-white/10 text-chalk/75 hover:border-chalk/40"
                  }`}
                >
                  <Icon name={TYPE_ICON[el.type]} size={13} className="shrink-0 text-hazard" />
                  <span className="truncate">{el.name}</span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-4 font-body text-[11px] leading-4 text-chalk/45">
            Drag to move, drag the corners to resize. Arrow keys nudge, Delete removes, ⌘/Ctrl+S saves.
          </p>
        </aside>

        {/* Canvas */}
        <section aria-label="Canvas" className="min-w-0 border border-white/10 bg-bay-floor">
          <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-1.5">
            <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/55">
              {design.width}×{design.height} · {Math.round(scale * 100)}%
            </p>
            <div className="flex items-center gap-1" role="group" aria-label="Zoom">
              <button type="button" aria-pressed={zoom === "fit"} onClick={() => setZoom("fit")} className={`px-2 py-1 font-mono text-[10px] uppercase tracking-[0.04em] ${zoom === "fit" ? "text-hazard" : "text-chalk/60"}`}>
                Fit
              </button>
              {ZOOMS.map((z) => (
                <button key={z} type="button" aria-pressed={zoom === z} onClick={() => setZoom(z)} className={`px-2 py-1 font-mono text-[10px] uppercase tracking-[0.04em] ${zoom === z ? "text-hazard" : "text-chalk/60"}`}>
                  {z * 100}%
                </button>
              ))}
              <label className="ml-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/60">
                <input type="checkbox" checked={grid} onChange={(e) => setGrid(e.target.checked)} className="accent-[#1EFF66]" />
                Grid
              </label>
            </div>
          </div>
          <div
            ref={canvasRef}
            className="flex max-h-[640px] min-h-[420px] overflow-auto p-4 [background-image:radial-gradient(rgba(232,230,225,0.07)_1px,transparent_1px)] [background-size:16px_16px]"
            onPointerDown={() => setSelectedId(null)}
          >
            <div className="m-auto shadow-[0_12px_40px_-12px_rgba(0,0,0,0.9)]">
              <DesignCanvas
                design={design}
                scale={scale}
                selectedId={selectedId}
                onSelect={setSelectedId}
                onDragStart={commit}
                onGeometry={(id, geo) =>
                  change({ ...design, elements: design.elements.map((e) => (e.id === id ? ({ ...e, ...geo } as DesignElement) : e)) }, false)
                }
                showGrid={grid}
              />
            </div>
          </div>
        </section>

        {/* Inspector */}
        <aside aria-label="Inspector" className="rounded-xl bg-bay-wall p-3">
          {selected ? (
            <div className="mb-3 flex items-center gap-1 border-b border-white/10 pb-3" role="toolbar" aria-label="Element actions">
              {(
                [
                  ["Duplicate", "copy", duplicateSelected],
                  ["Bring forward", "chevronUp", () => reorder(1)],
                  ["Send backward", "chevronDown", () => reorder(-1)],
                  ["Delete", "trash", removeSelected],
                ] as const
              ).map(([label, icon, action]) => (
                <button
                  key={label}
                  type="button"
                  onClick={action}
                  aria-label={label}
                  title={label}
                  className={`grid h-8 w-8 place-items-center border border-white/15 hover:border-hazard ${label === "Delete" ? "text-flag" : "text-chalk"}`}
                >
                  <Icon name={icon} size={14} />
                </button>
              ))}
              <button type="button" onClick={() => setSelectedId(null)} className="ml-auto font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/55 hover:text-hazard">
                Canvas
              </button>
            </div>
          ) : null}
          <Inspector design={design} element={selected} onElement={patchElement} onBackground={patchBackground} />
        </aside>
      </div>

      <PreviewModal design={design} open={modal === "preview"} onClose={() => setModal(null)} />
      <ExportModal design={design} open={modal === "export"} onClose={() => setModal(null)} />
      <PrepareModal
        design={design}
        open={modal === "prepare"}
        onClose={() => setModal(null)}
        onExport={() => setModal("export")}
        onOpenWorkflow={openWorkflow}
      />
    </div>
  );
}
