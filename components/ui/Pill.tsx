import type { ReactNode } from "react";

const DOT = {
  none: "",
  chalk: "bg-chalk/70",
  accent: "bg-hazard",
  good: "bg-torque",
  bad: "bg-flag",
} as const;

/** A small rounded tag: a format, a state, a size. Optionally led by a coloured dot. */
export function Pill({
  children,
  dot = "none",
  outline = false,
  className = "",
}: {
  children: ReactNode;
  dot?: keyof typeof DOT;
  outline?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.04em] ${
        outline ? "border border-white/15 text-chalk/60" : "bg-white/10 text-chalk/90"
      } ${className}`}
    >
      {dot !== "none" ? <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${DOT[dot]}`} /> : null}
      {children}
    </span>
  );
}
