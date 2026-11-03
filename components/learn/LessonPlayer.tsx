"use client";

import { useState } from "react";
import Link from "next/link";
import { ExploreDemo } from "@/components/learn/ExploreDemo";
import { Button, ButtonLink } from "@/components/ui/Button";
import { AdArt } from "@/components/ui/AdArt";
import { Icon } from "@/components/ui/Icon";
import { getAd } from "@/lib/demo/ads";
import { LESSONS } from "@/lib/demo/lessons";
import { adHref } from "@/lib/domain/meta";
import type { Lesson } from "@/lib/domain/types";
import { STORAGE_KEYS } from "@/lib/storage";
import { useStored } from "@/lib/use-stored";

export type LessonProgress = Record<string, number[]>;
const NO_PROGRESS: LessonProgress = {};

const KIND_LABEL = { explain: "Explain", explore: "Explore", exercise: "Exercise" } as const;

export function LessonPlayer({ lesson }: { lesson: Lesson }) {
  const [progress, setProgress] = useStored<LessonProgress>(STORAGE_KEYS.lessonProgress, NO_PROGRESS);
  const [index, setIndex] = useState(0);
  const [choices, setChoices] = useState<Record<number, string>>({});
  const [finished, setFinished] = useState(false);

  const completed = progress[lesson.slug] ?? [];
  const step = lesson.steps[index];
  const last = index === lesson.steps.length - 1;
  const related = getAd(lesson.relatedAdId);
  const nextLesson = LESSONS[(LESSONS.findIndex((l) => l.slug === lesson.slug) + 1) % LESSONS.length];

  const markDone = (i: number) => {
    if (completed.includes(i)) return;
    setProgress({ ...progress, [lesson.slug]: [...completed, i] });
  };

  const exerciseState = (() => {
    if (step.kind !== "exercise") return null;
    const chosenId = choices[index];
    const chosen = step.options.find((o) => o.id === chosenId);
    return { chosen, solved: chosen?.correct === true };
  })();

  const canAdvance = step.kind !== "exercise" || exerciseState?.solved === true;

  const next = () => {
    markDone(index);
    if (last) setFinished(true);
    else setIndex(index + 1);
  };

  const pick = (optionId: string) => {
    setChoices({ ...choices, [index]: optionId });
    const option = step.kind === "exercise" ? step.options.find((o) => o.id === optionId) : undefined;
    if (option?.correct) markDone(index);
  };

  const allDone = lesson.steps.every((_, i) => completed.includes(i));

  if (finished) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-torque">Lesson complete</p>
        <h1 className="mt-2 font-display text-4xl tracking-[0.04em]">Lesson complete</h1>
        <p className="mt-3 font-body text-sm leading-6 text-chalk/75">
          You finished <strong className="text-chalk">{lesson.title}</strong>. Put it to work: nothing here needs an
          account or a plan.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <ButtonLink href={`/create?template=${lesson.templateId}`}>
            <Icon name="layers" size={14} /> Build it in the studio
          </ButtonLink>
          {related && adHref(related) ? (
            <ButtonLink href={adHref(related) ?? "/gallery"} variant="secondary">
              See the example ad
            </ButtonLink>
          ) : null}
          <ButtonLink href={`/learn/${nextLesson.slug}`} variant="ghost">
            Next: {nextLesson.title}
          </ButtonLink>
        </div>
        <button type="button" onClick={() => { setFinished(false); setIndex(0); }} className="mt-6 font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/60 underline underline-offset-4">
          Review the lesson
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-6">
      <nav aria-label="Breadcrumb" className="font-mono text-[11px] uppercase tracking-[0.04em] text-chalk/60">
        <Link href="/learn" className="hover:text-hazard">Learn</Link>
        <span aria-hidden="true"> / </span>
        <span className="text-chalk">{lesson.title}</span>
      </nav>
      <h1 className="mt-3 font-display text-3xl tracking-[0.04em] sm:text-4xl">{lesson.title}</h1>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside aria-label="Lesson steps">
          <ol className="flex flex-col gap-1">
            {lesson.steps.map((s, i) => {
              const done = completed.includes(i);
              const active = i === index;
              return (
                <li key={`${s.title}-${i}`}>
                  <button
                    type="button"
                    aria-current={active ? "step" : undefined}
                    onClick={() => setIndex(i)}
                    className={`flex w-full items-start gap-3 border px-3 py-2.5 text-left transition-colors ${
                      active ? "border-hazard bg-hazard/10" : "border-white/10 hover:border-chalk/40"
                    }`}
                  >
                    <span
                      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center border font-mono text-[10px] ${
                        done ? "border-torque bg-torque text-bay-floor" : "border-white/30 text-chalk/60"
                      }`}
                    >
                      {done ? <Icon name="check" size={12} /> : i + 1}
                    </span>
                    <span>
                      <span className="block font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/50">
                        {KIND_LABEL[s.kind]}
                      </span>
                      <span className="block font-body text-sm text-chalk">{s.title}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
          <p className="mt-3 font-mono text-[11px] text-chalk/55">
            {completed.length} of {lesson.steps.length} steps done
            {allDone ? " · all complete" : ""}
          </p>
        </aside>

        <section aria-labelledby="step-title" className="min-w-0 rounded-xl bg-bay-wall p-5 sm:p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-hazard">
            Step {index + 1} of {lesson.steps.length} · {KIND_LABEL[step.kind]}
          </p>
          <h2 id="step-title" className="mt-1 font-display text-2xl tracking-[0.04em]">
            {step.title}
          </h2>

          {step.kind === "explain" ? (
            <div className="mt-4 grid gap-6 md:grid-cols-[1fr_minmax(0,320px)]">
              <div className="flex flex-col gap-3 font-body text-sm leading-7 text-chalk/80">
                {step.body.map((p) => (
                  <p key={p}>{p}</p>
                ))}
                {step.callouts?.map((c) => (
                  <p key={c.label} className="border-l-2 border-hazard pl-3 text-chalk/70">
                    <strong className="text-chalk">{c.label}.</strong> {c.note}
                  </p>
                ))}
              </div>
              {step.previewAdId ? <ExplainPreview adId={step.previewAdId} /> : null}
            </div>
          ) : null}

          {step.kind === "explore" ? (
            <div className="mt-4">
              {step.body.map((p) => (
                <p key={p} className="mb-4 font-body text-sm leading-7 text-chalk/80">
                  {p}
                </p>
              ))}
              <ExploreDemo control={step.control} />
            </div>
          ) : null}

          {step.kind === "exercise" ? (
            <div className="mt-4">
              <p className="font-body text-sm leading-7 text-chalk/85">{step.prompt}</p>
              <ul className="mt-4 flex flex-col gap-2">
                {step.options.map((option) => {
                  const chosen = choices[index] === option.id;
                  const tone = chosen ? (option.correct ? "border-torque bg-torque/10" : "border-flag bg-flag/10") : "border-white/15 hover:border-chalk/50";
                  return (
                    <li key={option.id}>
                      <button
                        type="button"
                        aria-pressed={chosen}
                        disabled={exerciseState?.solved === true && !chosen}
                        onClick={() => pick(option.id)}
                        className={`w-full border px-4 py-3 text-left font-body text-sm text-chalk transition-colors disabled:opacity-50 ${tone}`}
                      >
                        {option.label}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {exerciseState?.chosen ? (
                <p
                  role="status"
                  aria-live="polite"
                  className={`mt-4 border-l-2 pl-3 font-body text-sm leading-6 ${exerciseState.solved ? "border-torque text-torque" : "border-flag text-flag"}`}
                >
                  {exerciseState.solved ? "Correct. " : "Not quite. "}
                  {exerciseState.chosen.feedback}
                  {!exerciseState.solved ? " Try another option." : ""}
                </p>
              ) : null}
            </div>
          ) : null}

          <div className="mt-8 flex items-center justify-between gap-3 border-t border-white/10 pt-4">
            <Button variant="ghost" disabled={index === 0} onClick={() => setIndex(index - 1)}>
              <Icon name="arrowLeft" size={14} /> Back
            </Button>
            <Button disabled={!canAdvance} onClick={next}>
              {last ? "Finish lesson" : "Continue"} <Icon name="arrowRight" size={14} />
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function ExplainPreview({ adId }: { adId: string }) {
  const ad = getAd(adId);
  if (!ad) return null;
  const href = adHref(ad);
  return (
    <figure className="min-w-0">
      <div className="grid place-items-center border border-white/10 bg-bay-floor p-4">
        <AdArt ad={ad} maxWidth={280} maxHeight={240} />
      </div>
      <figcaption className="mt-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.04em] text-chalk/55">{ad.title}</p>
        <ol className="mt-2 flex flex-col gap-1.5">
          {ad.anatomy.map((part, i) => (
            <li key={part.label} className="flex gap-2 font-body text-xs leading-5 text-chalk/70">
              <span className="grid h-4 w-4 shrink-0 place-items-center border border-hazard font-mono text-[9px] text-hazard">{i + 1}</span>
              <span>
                <strong className="text-chalk">{part.label}.</strong> {part.note}
              </span>
            </li>
          ))}
        </ol>
        {href ? (
          <Link href={href} className="mt-3 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.04em] text-hazard">
            Try it live <Icon name="arrowRight" size={12} />
          </Link>
        ) : null}
      </figcaption>
    </figure>
  );
}
