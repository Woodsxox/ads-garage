"use client";

import Link from "next/link";
import { ButtonLink } from "@/components/ui/Button";
import type { LessonProgress } from "@/components/learn/LessonPlayer";
import { Icon } from "@/components/ui/Icon";
import { PageHeader } from "@/components/ui/PageHeader";
import { Pill } from "@/components/ui/Pill";
import { TILE, TILE_GRID, TILE_LINK } from "@/components/ui/tile";
import { LESSONS } from "@/lib/demo/lessons";
import { FORMAT_META } from "@/lib/domain/meta";
import { STORAGE_KEYS } from "@/lib/storage";
import { useStored } from "@/lib/use-stored";

const NO_PROGRESS: LessonProgress = {};

const STEPS = [
  { title: "Understand", body: "Short explanations with the real ad next to them." },
  { title: "Explore", body: "Change a headline, a color or a layout and see the result." },
  { title: "Practice", body: "Quick exercises with instant feedback. Your progress saves in this browser." },
];

export function LessonIndex() {
  const [progress] = useStored<LessonProgress>(STORAGE_KEYS.lessonProgress, NO_PROGRESS);

  return (
    <div className="mx-auto max-w-[1800px] px-4 pb-8 pt-10 sm:px-6">
      <PageHeader eyebrow={`Learn · ${LESSONS.length} lessons`} title="Learn">
        Short lessons, one per format. Learning is separate from publishing: you never need to connect an advertising
        account or choose a plan.
      </PageHeader>

      <ol className={`${TILE_GRID} md:grid-cols-3`}>
        {STEPS.map((s, i) => (
          <li key={s.title} className="flex flex-col gap-3 bg-bay-floor p-6">
            <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/50">{String(i + 1).padStart(2, "0")}</span>
            <h2 className="mt-6 font-display text-2xl font-medium">{s.title}</h2>
            <p className="font-body text-sm leading-6 text-chalk/60">{s.body}</p>
          </li>
        ))}
      </ol>

      <ul className={`${TILE_GRID} mt-16 md:grid-cols-2`}>
        {LESSONS.map((lesson) => {
          const done = (progress[lesson.slug] ?? []).length;
          const total = lesson.steps.length;
          const complete = done >= total;
          return (
            <li key={lesson.slug} className={`${TILE} min-h-[260px] gap-4 p-6`}>
              <div className="flex flex-wrap items-center gap-1.5">
                <Pill>{FORMAT_META[lesson.format].label}</Pill>
                <Pill outline>{lesson.level}</Pill>
                <Pill outline>{lesson.minutes} min</Pill>
              </div>
              <h2 className="mt-4 font-display text-3xl font-medium leading-[1.05]">
                <Link href={`/learn/${lesson.slug}`} className={TILE_LINK}>
                  {lesson.title}
                </Link>
              </h2>
              <p className="max-w-lg font-body text-sm leading-6 text-chalk/60">{lesson.summary}</p>
              <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                <div className="flex items-center gap-3">
                  <div className="h-1 w-28 rounded-full bg-white/10" role="progressbar" aria-label={`${lesson.title} progress`} aria-valuemin={0} aria-valuemax={total} aria-valuenow={Math.min(done, total)}>
                    <div className={`h-full rounded-full ${complete ? "bg-torque" : "bg-hazard"}`} style={{ width: `${Math.min(100, (done / total) * 100)}%` }} />
                  </div>
                  <span className="font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/55">
                    {complete ? "Complete" : done > 0 ? `${done}/${total} steps` : `${total} steps`}
                  </span>
                </div>
                <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.04em] text-hazard">
                  {done > 0 && !complete ? "Resume" : complete ? "Review" : "Start"}
                  <Icon name="arrowRight" size={13} />
                </span>
              </div>
            </li>
          );
        })}
      </ul>

      <div className="mt-16 flex flex-col items-start gap-5 rounded-xl border border-white/15 p-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-display text-3xl font-medium">Ready to apply it?</p>
          <p className="mt-1 font-body text-sm text-chalk/60">Every lesson links to a matching template in the creation studio.</p>
        </div>
        <ButtonLink href="/create">
          Open the studio <Icon name="arrowRight" size={14} />
        </ButtonLink>
      </div>
    </div>
  );
}
