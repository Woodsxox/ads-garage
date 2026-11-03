"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Tabs, tabIds } from "@/components/ui/Tabs";
import { designToPreviewDocument } from "@/lib/studio/codegen";
import type { AdDesign } from "@/lib/studio/model";

const MODES = [
  { id: "ad", label: "Ad only" },
  { id: "context", label: "In a page" },
] as const;
type Mode = (typeof MODES)[number]["id"];

const DEVICES = [
  { id: "desktop", label: "Desktop", width: 900 },
  { id: "tablet", label: "Tablet", width: 640 },
  { id: "mobile", label: "Mobile", width: 360 },
] as const;

export function PreviewModal({ design, open, onClose }: { design: AdDesign; open: boolean; onClose: () => void }) {
  const [mode, setMode] = useState<Mode>("ad");
  const [device, setDevice] = useState<(typeof DEVICES)[number]["id"]>("desktop");
  const deviceWidth = DEVICES.find((d) => d.id === device)?.width ?? 900;

  const doc = useMemo(
    () => (open ? designToPreviewDocument(design, mode, deviceWidth) : ""),
    [design, mode, deviceWidth, open],
  );

  // Ad-only: scale big creatives down to fit the dialog.
  const fit = Math.min(1, 760 / design.width, 480 / design.height);
  const frameW = mode === "ad" ? Math.round(design.width * fit) + 2 : deviceWidth;
  const frameH = mode === "ad" ? Math.round(design.height * fit) + 2 : 520;

  return (
    <Modal open={open} onClose={onClose} title="Preview" size="lg">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <Tabs items={MODES} value={mode} onChange={setMode} label="Preview mode" idPrefix="preview" />
        {mode === "context" ? (
          <div className="flex gap-1" role="group" aria-label="Device width">
            {DEVICES.map((d) => (
              <button
                key={d.id}
                type="button"
                aria-pressed={device === d.id}
                onClick={() => setDevice(d.id)}
                className={`border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.04em] ${
                  device === d.id ? "border-hazard text-hazard" : "border-white/20 text-chalk/70"
                }`}
              >
                {d.label} {d.width}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div
        role="tabpanel"
        id={tabIds("preview", mode).panel}
        aria-labelledby={tabIds("preview", mode).tab}
        className="mt-4 grid place-items-center overflow-auto border border-white/10 bg-bay-floor p-4 [background-image:radial-gradient(rgba(232,230,225,0.08)_1px,transparent_1px)] [background-size:16px_16px]"
      >
        <div style={{ width: frameW, height: frameH, maxWidth: "100%" }} className="overflow-hidden">
          {mode === "ad" ? (
            <iframe
              title="Ad preview"
              srcDoc={doc}
              sandbox=""
              referrerPolicy="no-referrer"
              className="block border-0 bg-transparent"
              style={{ width: design.width + 2, height: design.height + 2, transform: `scale(${fit})`, transformOrigin: "0 0" }}
            />
          ) : (
            <iframe
              title="Ad in a page preview"
              srcDoc={doc}
              sandbox=""
              referrerPolicy="no-referrer"
              className="block h-full w-full border-0 bg-white"
            />
          )}
        </div>
      </div>
      <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/50">
        {design.width}×{design.height}
        {mode === "ad" && fit < 1 ? ` · shown at ${Math.round(fit * 100)}%` : ""} · rendered in a fully sandboxed frame
      </p>
    </Modal>
  );
}
