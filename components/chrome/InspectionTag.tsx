import type { ReactNode } from "react";

type Tone = "hazard" | "torque" | "flag" | "chalk";

const TONE: Record<Tone, string> = {
  hazard: "border-hazard text-hazard",
  torque: "border-torque text-torque",
  flag: "border-flag text-flag",
  chalk: "border-chalk/40 text-chalk/80",
};

export function InspectionTag({
  children,
  tone = "hazard",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.04em] ${TONE[tone]}`}
    >
      {children}
    </span>
  );
}
