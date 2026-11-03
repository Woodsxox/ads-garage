import type { CSSProperties, ReactNode } from "react";

/**
 * An endless scroller, driven by CSS only (no JavaScript, and it stops for reduced-motion users).
 * The content is rendered twice and the track slides by exactly one copy, so the loop is seamless.
 * The second copy is `inert`: hidden from assistive tech and unreachable by keyboard.
 * It pauses while hovered or focused, so nothing moves under a pointer that is about to click.
 */
export function Marquee({
  axis,
  reverse = false,
  duration = 60,
  gap = 12,
  className = "",
  children,
}: {
  axis: "x" | "y";
  reverse?: boolean;
  /** Seconds for one full loop. Larger is slower. */
  duration?: number;
  gap?: number;
  className?: string;
  children: ReactNode;
}) {
  const horizontal = axis === "x";
  const copy = horizontal ? "flex shrink-0 items-stretch" : "flex shrink-0 flex-col";
  const spacing: CSSProperties = horizontal ? { gap, paddingRight: gap } : { gap, paddingBottom: gap };

  return (
    <div className={`ag-marquee overflow-hidden ${className}`}>
      <div
        className={`${horizontal ? "ag-marquee-x flex w-max" : "ag-marquee-y flex flex-col"} ${reverse ? "ag-marquee-reverse" : ""}`}
        style={{ "--ag-duration": `${duration}s` } as CSSProperties}
      >
        <div className={copy} style={spacing}>
          {children}
        </div>
        <div className={copy} style={spacing} aria-hidden="true" inert>
          {children}
        </div>
      </div>
    </div>
  );
}
