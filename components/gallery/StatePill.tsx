import { AVAILABILITY_META } from "@/lib/domain/meta";
import type { AdAvailability } from "@/lib/domain/types";

const DOT = {
  chalk: "bg-chalk/70",
  torque: "bg-torque",
  hazard: "bg-hazard",
  flag: "bg-flag",
} as const;

/** A compact state label: a coloured dot and the state name, as a pill. */
export function StatePill({ state }: { state: AdAvailability }) {
  const meta = AVAILABILITY_META[state];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/90">
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${DOT[meta.tone]}`} />
      {meta.label}
    </span>
  );
}
