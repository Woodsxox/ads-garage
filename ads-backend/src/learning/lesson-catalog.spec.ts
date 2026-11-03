import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { GRADUATE_BADGE_ID, BADGE_TITLES, exerciseSteps, findLesson, gradeLesson, LESSONS, PASS_MARK } from './lesson-catalog.js';

describe('gradeLesson', () => {
  const lesson = findLesson('anatomy-of-an-image-ad')!;

  it('scores all correct as 100 and passes', () => {
    expect(gradeLesson(lesson, { '3': 'b', '4': 'a' })).toEqual({
      score: 100,
      passed: true,
      results: [{ step: 3, correct: true }, { step: 4, correct: true }],
    });
  });

  it('scores half right as 50 and fails the pass mark', () => {
    const result = gradeLesson(lesson, { '3': 'b', '4': 'c' });
    expect(result.score).toBe(50);
    expect(result.passed).toBe(false);
    expect(PASS_MARK).toBeGreaterThan(50);
  });

  it('counts missing answers as wrong and never leaks the key', () => {
    const result = gradeLesson(lesson, {});
    expect(result.score).toBe(0);
    expect(JSON.stringify(result)).not.toMatch(/"b"|"a"/);
  });

  it('ignores answers to steps that are not exercises', () => {
    expect(gradeLesson(lesson, { '0': 'a', '3': 'b', '4': 'a' }).score).toBe(100);
  });
});

describe('catalog', () => {
  it('has unique slugs and badges, each with a title, and exercises inside the lesson', () => {
    expect(new Set(LESSONS.map((l) => l.slug)).size).toBe(LESSONS.length);
    expect(new Set(LESSONS.map((l) => l.badgeId)).size).toBe(LESSONS.length);
    for (const lesson of LESSONS) {
      expect(BADGE_TITLES[lesson.badgeId]).toBeTruthy();
      for (const step of exerciseSteps(lesson)) expect(step).toBeLessThan(lesson.steps);
    }
    expect(BADGE_TITLES[GRADUATE_BADGE_ID]).toBeTruthy();
  });
});

// Guards against the web app's lesson content changing without this catalog being updated.
const WEB_LESSONS = resolve(import.meta.dirname, '../../../lib/demo/lessons.ts');
describe.skipIf(!existsSync(WEB_LESSONS))('catalog matches the web app lessons', () => {
  it('has the same lessons, step counts and answer keys', async () => {
    const mod = (await import(/* @vite-ignore */ WEB_LESSONS)) as {
      LESSONS: { slug: string; steps: { kind: string; options?: { id: string; correct: boolean }[] }[] }[];
    };
    expect(mod.LESSONS.map((l) => l.slug).sort()).toEqual(LESSONS.map((l) => l.slug).sort());
    for (const web of mod.LESSONS) {
      const ours = findLesson(web.slug)!;
      expect(ours.steps, `${web.slug} step count`).toBe(web.steps.length);
      const key: Record<number, string> = {};
      web.steps.forEach((step, index) => {
        if (step.kind !== 'exercise') return;
        const correct = step.options!.filter((o) => o.correct);
        expect(correct, `${web.slug} step ${index} must have exactly one correct option`).toHaveLength(1);
        key[index] = correct[0].id;
      });
      expect(ours.answers, `${web.slug} answer key`).toEqual(key);
    }
  });
});
