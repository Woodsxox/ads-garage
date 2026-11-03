"use client";

import { useRef, type CSSProperties, type PointerEvent } from "react";
import { elementStyle, imageSrc, rootStyle } from "@/lib/studio/codegen";
import type { AdDesign, DesignElement } from "@/lib/studio/model";

type Geometry = { x: number; y: number; w: number; h: number };
type Mode = "move" | "nw" | "ne" | "sw" | "se";

const MIN = 8;
const HANDLES: { mode: Exclude<Mode, "move">; style: CSSProperties; cursor: string }[] = [
  { mode: "nw", style: { left: 0, top: 0 }, cursor: "nwse-resize" },
  { mode: "ne", style: { right: 0, top: 0 }, cursor: "nesw-resize" },
  { mode: "sw", style: { left: 0, bottom: 0 }, cursor: "nesw-resize" },
  { mode: "se", style: { right: 0, bottom: 0 }, cursor: "nwse-resize" },
];

function Node({ el, style, ...handlers }: { el: DesignElement; style: CSSProperties } & Record<string, unknown>) {
  switch (el.type) {
    case "text":
      return (
        <div style={style} {...handlers}>
          {el.text}
        </div>
      );
    case "image":
      // Editor surface: data URLs and motif SVGs, so next/image offers nothing here.
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={imageSrc(el)} alt={el.alt} draggable={false} style={style} {...handlers} />;
    case "button":
      return (
        <div style={style} {...handlers}>
          {el.label}
        </div>
      );
    case "shape":
      return <div style={style} {...handlers} />;
  }
}

/**
 * Renders a design at a given scale. When `onGeometry` is provided the canvas is interactive:
 * click to select, drag to move, drag the corner handles to resize.
 */
export function DesignCanvas({
  design,
  scale,
  selectedId = null,
  onSelect,
  onDragStart,
  onGeometry,
  showGrid = false,
  className = "",
}: {
  design: AdDesign;
  scale: number;
  selectedId?: string | null;
  onSelect?: (id: string | null) => void;
  /** Fired once, on the first movement of a drag, so the editor can record one undo step. */
  onDragStart?: () => void;
  onGeometry?: (id: string, geometry: Geometry) => void;
  showGrid?: boolean;
  className?: string;
}) {
  const interactive = Boolean(onGeometry);
  const drag = useRef<{ id: string; mode: Mode; sx: number; sy: number; origin: Geometry; started: boolean } | null>(null);

  const begin = (event: PointerEvent<HTMLElement>, el: DesignElement, mode: Mode) => {
    event.stopPropagation();
    onSelect?.(el.id);
    if (!interactive) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      id: el.id,
      mode,
      sx: event.clientX,
      sy: event.clientY,
      origin: { x: el.x, y: el.y, w: el.w, h: el.h },
      started: false,
    };
  };

  const move = (event: PointerEvent<HTMLElement>) => {
    const d = drag.current;
    if (!d || !onGeometry) return;
    const dx = (event.clientX - d.sx) / scale;
    const dy = (event.clientY - d.sy) / scale;
    if (!d.started) {
      if (Math.abs(dx) + Math.abs(dy) < 2 / scale) return;
      d.started = true;
      onDragStart?.();
    }
    let { x, y, w, h } = d.origin;
    if (d.mode === "move") {
      x += dx;
      y += dy;
    } else {
      if (d.mode.includes("e")) w += dx;
      if (d.mode.includes("w")) {
        x += dx;
        w -= dx;
      }
      if (d.mode.includes("s")) h += dy;
      if (d.mode.includes("n")) {
        y += dy;
        h -= dy;
      }
      if (w < MIN) {
        if (d.mode.includes("w")) x -= MIN - w;
        w = MIN;
      }
      if (h < MIN) {
        if (d.mode.includes("n")) y -= MIN - h;
        h = MIN;
      }
    }
    onGeometry(d.id, { x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) });
  };

  const end = () => {
    drag.current = null;
  };

  const selected = design.elements.find((e) => e.id === selectedId) ?? null;
  const handle = 10 / scale;

  return (
    <div className={className} style={{ width: design.width * scale, height: design.height * scale }}>
      <div
        data-testid="design-root"
        style={{ ...rootStyle(design), transform: `scale(${scale})`, transformOrigin: "0 0", touchAction: interactive ? "none" : undefined }}
        onPointerDown={() => onSelect?.(null)}
      >
        {design.elements.map((el) => {
          const handlers = interactive
            ? {
                onPointerDown: (e: PointerEvent<HTMLElement>) => begin(e, el, "move"),
                onPointerMove: move,
                onPointerUp: end,
                onPointerCancel: end,
                "data-element": el.id,
              }
            : {};
          return (
            <Node
              key={el.id}
              el={el}
              style={{ ...elementStyle(el), ...(interactive ? { cursor: "move", userSelect: "none" } : null) } as CSSProperties}
              {...handlers}
            />
          );
        })}

        {showGrid ? (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              pointerEvents: "none",
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
        ) : null}

        {interactive && selected ? (
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              left: selected.x,
              top: selected.y,
              width: selected.w,
              height: selected.h,
              outline: `${2 / scale}px solid #1EFF66`,
              pointerEvents: "none",
            }}
          >
            {HANDLES.map((h) => (
              <div
                key={h.mode}
                data-handle={h.mode}
                onPointerDown={(e) => begin(e, selected, h.mode)}
                onPointerMove={move}
                onPointerUp={end}
                onPointerCancel={end}
                style={{
                  position: "absolute",
                  width: handle,
                  height: handle,
                  marginLeft: h.style.left === 0 ? -handle / 2 : undefined,
                  marginRight: h.style.right === 0 ? -handle / 2 : undefined,
                  marginTop: h.style.top === 0 ? -handle / 2 : undefined,
                  marginBottom: h.style.bottom === 0 ? -handle / 2 : undefined,
                  background: "#1EFF66",
                  border: `${1 / scale}px solid #0B0B0B`,
                  cursor: h.cursor,
                  pointerEvents: "auto",
                  ...h.style,
                }}
              />
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
