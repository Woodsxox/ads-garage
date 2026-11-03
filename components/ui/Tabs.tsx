"use client";

import { useRef, type KeyboardEvent } from "react";

export type TabItem<T extends string> = { id: T; label: string };

export function tabIds(prefix: string, id: string) {
  return { tab: `${prefix}-tab-${id}`, panel: `${prefix}-panel-${id}` };
}

/** Accessible tab list. Render each panel with role="tabpanel" and the ids from `tabIds`. */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  label,
  idPrefix,
  className = "",
}: {
  items: readonly TabItem<T>[];
  value: T;
  onChange: (next: T) => void;
  label: string;
  idPrefix: string;
  className?: string;
}) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const onKeyDown = (event: KeyboardEvent, index: number) => {
    let next = index;
    if (event.key === "ArrowRight") next = (index + 1) % items.length;
    else if (event.key === "ArrowLeft") next = (index - 1 + items.length) % items.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    else return;
    event.preventDefault();
    onChange(items[next].id);
    refs.current[items[next].id]?.focus();
  };

  return (
    <div role="tablist" aria-label={label} className={`flex flex-wrap gap-1 border-b border-white/10 ${className}`}>
      {items.map((item, index) => {
        const selected = item.id === value;
        const ids = tabIds(idPrefix, item.id);
        return (
          <button
            key={item.id}
            ref={(node) => {
              refs.current[item.id] = node;
            }}
            id={ids.tab}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={ids.panel}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(item.id)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={`-mb-px border-b-2 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.04em] ${
              selected ? "border-hazard text-hazard" : "border-transparent text-chalk/60 hover:text-chalk"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
