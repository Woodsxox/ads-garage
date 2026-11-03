"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "@/components/ui/Icon";

const NAV_BTN =
  "grid h-8 w-8 place-items-center text-chalk/80 hover:bg-white/10 hover:text-hazard disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-chalk/80";

/** A browser-like window. Purely presentational: the viewer decides what the controls do. */
export function BrowserFrame({
  title,
  url,
  canBack,
  canForward,
  onBack,
  onForward,
  onReload,
  isolationNotes,
  children,
}: {
  title: string;
  url: string;
  canBack: boolean;
  canForward: boolean;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  isolationNotes: string[];
  children: ReactNode;
}) {
  const [showNotes, setShowNotes] = useState(false);
  const secure = url.startsWith("https://");

  return (
    <div className="overflow-hidden rounded-xl bg-bay-wall shadow-[0_24px_60px_-24px_rgba(0,0,0,0.8)]">
      <div className="flex items-end gap-3 bg-[#202328] px-3 pt-2">
        <div className="flex gap-1.5 pb-2.5" aria-hidden="true">
          <i className="block h-2.5 w-2.5 rounded-full bg-flag" />
          <i className="block h-2.5 w-2.5 rounded-full bg-hazard" />
          <i className="block h-2.5 w-2.5 rounded-full bg-torque" />
        </div>
        <div className="flex min-w-0 max-w-xs items-center gap-2 rounded-t-md bg-bay-wall px-3 py-1.5">
          <span className="grid h-4 w-4 shrink-0 place-items-center bg-hazard font-mono text-[9px] font-bold text-bay-floor" aria-hidden="true">
            A
          </span>
          <span className="truncate font-body text-xs text-chalk/85">{title}</span>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-white/10 px-2 py-1.5">
        <button type="button" className={NAV_BTN} onClick={onBack} disabled={!canBack} aria-label="Back">
          <Icon name="chevronLeft" size={16} />
        </button>
        <button type="button" className={NAV_BTN} onClick={onForward} disabled={!canForward} aria-label="Forward">
          <Icon name="chevronRight" size={16} />
        </button>
        <button type="button" className={NAV_BTN} onClick={onReload} aria-label="Reload">
          <Icon name="refresh" size={15} />
        </button>
        <div
          className="mx-1 flex min-w-0 flex-1 items-center gap-2 rounded-full bg-bay-floor px-3 py-1.5"
          role="textbox"
          aria-readonly="true"
          aria-label="Address"
        >
          <Icon name={secure ? "lock" : "shield"} size={13} className={secure ? "shrink-0 text-torque" : "shrink-0 text-hazard"} />
          <span className="truncate font-mono text-xs text-chalk/80">{url}</span>
        </div>
        <button
          type="button"
          onClick={() => setShowNotes((v) => !v)}
          aria-expanded={showNotes}
          className="flex items-center gap-1.5 border border-torque/60 px-2 py-1 font-mono text-[10px] uppercase tracking-[0.04em] text-torque hover:bg-torque/10"
        >
          <Icon name="shield" size={12} />
          <span className="hidden sm:inline">Sandboxed</span>
        </button>
      </div>

      {showNotes ? (
        <div className="border-b border-white/10 bg-bay-floor px-4 py-3">
          <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-torque">How this frame is isolated</p>
          <ul className="mt-2 flex list-disc flex-col gap-1 pl-5 font-body text-xs leading-5 text-chalk/75 marker:text-torque">
            {isolationNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="relative bg-bay-floor [background-image:radial-gradient(rgba(232,230,225,0.09)_1px,transparent_1px)] [background-size:18px_18px]">
        {children}
      </div>
    </div>
  );
}
