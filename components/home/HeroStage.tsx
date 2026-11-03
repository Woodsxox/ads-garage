"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AdFrame } from "@/components/sandbox/AdFrame";
import { Icon } from "@/components/ui/Icon";
import { StateBadge } from "@/components/ui/StateBadge";
import { isAdMessage } from "@/lib/ads/ad-document";
import type { AdAvailability } from "@/lib/domain/types";

export type HeroItem = {
  id: string;
  tab: string;
  title: string;
  doc: string;
  width: number;
  height: number;
  state: AdAvailability;
  href: string;
  hint: string;
};

/** The hero shows real, sandboxed ads. Click inside one: the page reports what the ad sent. */
export function HeroStage({ items }: { items: HeroItem[] }) {
  const [index, setIndex] = useState(0);
  const [events, setEvents] = useState<string[]>([]);
  const frame = useRef<HTMLIFrameElement>(null);
  const item = items[index];

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      if (event.source !== frame.current?.contentWindow || !isAdMessage(event.data)) return;
      const { type, key } = event.data;
      const label = type === "navigate" ? "navigate → destination (opens in the sandbox)" : key;
      setEvents((prev) => [label, ...prev].slice(0, 3));
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const select = (i: number) => {
    setIndex(i);
    setEvents([]);
  };

  return (
    <div className="border border-white/15 bg-bay-wall shadow-[0_30px_70px_-30px_rgba(0,0,0,0.9)]">
      <div role="tablist" aria-label="Ad formats to try" className="flex border-b border-white/10">
        {items.map((it, i) => (
          <button
            key={it.id}
            type="button"
            role="tab"
            id={`hero-tab-${it.id}`}
            aria-selected={i === index}
            aria-controls="hero-panel"
            tabIndex={i === index ? 0 : -1}
            onClick={() => select(i)}
            className={`flex-1 border-b-2 px-2 py-2.5 font-mono text-[11px] uppercase tracking-[0.04em] ${
              i === index ? "border-hazard text-hazard" : "border-transparent text-chalk/60 hover:text-chalk"
            }`}
          >
            {it.tab}
          </button>
        ))}
      </div>

      <div id="hero-panel" role="tabpanel" aria-labelledby={`hero-tab-${item.id}`}>
        <div className="grid min-h-[360px] place-items-center bg-bay-floor p-5 [background-image:radial-gradient(rgba(232,230,225,0.09)_1px,transparent_1px)] [background-size:18px_18px]">
          <div className="border border-dashed border-hazard/60 p-2.5">
            <AdFrame key={item.id} ref={frame} doc={item.doc} title={`${item.title} — try it`} width={item.width} height={item.height} />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/10 p-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <StateBadge state={item.state} />
              <span className="truncate font-body text-sm text-chalk">{item.title}</span>
            </div>
            <p className="mt-1 font-body text-xs text-chalk/55" aria-live="polite">
              {events.length > 0 ? (
                <>
                  <span className="text-torque">Ad says:</span> {events[0]}
                </>
              ) : (
                item.hint
              )}
            </p>
          </div>
          <Link href={item.href} className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.04em] text-hazard">
            Open full view <Icon name="arrowRight" size={13} />
          </Link>
        </div>
      </div>
    </div>
  );
}
