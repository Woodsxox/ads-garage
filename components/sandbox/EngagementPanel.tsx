"use client";

import { Button } from "@/components/ui/Button";
import { Icon } from "@/components/ui/Icon";
import type { Requirement } from "@/lib/domain/types";

export const TIMER_OPTIONS = [
  { value: "default", label: "Ad default" },
  { value: "5", label: "5 seconds" },
  { value: "10", label: "10 seconds" },
  { value: "30", label: "30 seconds" },
  { value: "0", label: "Skip timer (reviewer)" },
] as const;

function fmt(seconds: number): string {
  return `${Math.ceil(seconds)}s`;
}

export function EngagementPanel({
  total,
  elapsed,
  requirements,
  done,
  pausedReason,
  complete,
  timerChoice,
  onTimerChoice,
  onRestart,
}: {
  total: number;
  elapsed: number;
  requirements: Requirement[];
  done: string[];
  pausedReason: string | null;
  complete: boolean;
  timerChoice: string;
  onTimerChoice: (value: string) => void;
  onRestart: () => void;
}) {
  const remaining = Math.max(0, total - elapsed);
  const pct = total > 0 ? Math.min(100, (elapsed / total) * 100) : 100;

  return (
    <section aria-labelledby="engagement-heading" className="rounded-xl bg-bay-wall p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 id="engagement-heading" className="font-display text-sm tracking-[0.04em]">
          Engagement
        </h2>
        <span
          className={`font-mono text-[10px] uppercase tracking-[0.04em] ${complete ? "text-torque" : "text-hazard"}`}
        >
          {complete ? "Complete" : pausedReason ? "Paused" : "In progress"}
        </span>
      </div>

      <div className="mt-4">
        <div className="flex items-baseline justify-between font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/60">
          <span>Viewing time</span>
          <span className="text-chalk">
            {total > 0 ? (remaining > 0 ? `${fmt(remaining)} left of ${total}s` : `${total}s reached`) : "No minimum"}
          </span>
        </div>
        <div
          className="mt-1.5 h-2 overflow-hidden bg-bay-floor"
          role="progressbar"
          aria-label="Viewing time"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct)}
        >
          <div className="h-full bg-hazard transition-[width] duration-200" style={{ width: `${pct}%` }} />
        </div>
        {pausedReason && !complete ? (
          <p className="mt-1.5 font-body text-xs text-chalk/55">Timer paused: {pausedReason}.</p>
        ) : null}
      </div>

      {requirements.length > 0 ? (
        <div className="mt-5">
          <p className="font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/60">Required actions</p>
          <ul className="mt-2 flex flex-col gap-2">
            {requirements.map((req) => {
              const ok = done.includes(req.key);
              return (
                <li key={req.key} className="flex items-center gap-2.5 font-body text-sm">
                  <span
                    className={`grid h-5 w-5 shrink-0 place-items-center border ${
                      ok ? "border-torque bg-torque text-bay-floor" : "border-white/25 text-transparent"
                    }`}
                  >
                    <Icon name="check" size={13} />
                  </span>
                  <span className={ok ? "text-chalk" : "text-chalk/70"}>
                    {req.label}
                    <span className="sr-only">{ok ? " — done" : " — not done yet"}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}

      <div className="mt-5 border-t border-white/10 pt-4">
        <label htmlFor="timer-choice" className="block font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/60">
          Demo timer
        </label>
        <select
          id="timer-choice"
          value={timerChoice}
          onChange={(event) => onTimerChoice(event.target.value)}
          className="mt-1.5 w-full border border-white/15 bg-bay-floor px-3 py-2 font-body text-sm text-chalk"
        >
          {TIMER_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <Button variant="ghost" size="sm" className="mt-3" onClick={onRestart}>
          <Icon name="refresh" size={13} /> Restart experience
        </Button>
      </div>

      <p className="mt-4 border-l-2 border-hazard pl-3 font-body text-xs leading-5 text-chalk/60">
        Demo only. Viewing time here is not a valid paid impression, and nothing is earned or recorded.
      </p>
    </section>
  );
}
