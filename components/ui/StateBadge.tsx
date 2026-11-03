import { Pill } from "@/components/ui/Pill";
import { AVAILABILITY_META } from "@/lib/domain/meta";
import type { AdAvailability, FeatureStatus } from "@/lib/domain/types";

const STATE_DOT = { chalk: "chalk", torque: "good", hazard: "accent", flag: "bad" } as const;

export function StateBadge({ state }: { state: AdAvailability }) {
  const meta = AVAILABILITY_META[state];
  return <Pill dot={STATE_DOT[meta.tone]}>{meta.label}</Pill>;
}

const STATUS = {
  available: { label: "Available now", dot: "good" },
  preview: { label: "Demo preview", dot: "accent" },
  planned: { label: "Planned", dot: "chalk" },
} as const;

export function FeatureStatusTag({ status }: { status: FeatureStatus }) {
  const s = STATUS[status];
  return (
    <Pill dot={s.dot} className="shrink-0">
      {s.label}
    </Pill>
  );
}
