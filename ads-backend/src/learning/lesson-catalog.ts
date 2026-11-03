/**
 * Lesson structure and answer keys, held on the server so exercises are graded here and a score
 * cannot be forged from the browser. Lesson *content* (the explanations, feedback text) stays in
 * the web app; the API only needs the shape and the keys.
 *
 * This duplicates `lib/demo/lessons.ts` in the web app. `lesson-catalog.spec.ts` fails if the two
 * drift apart. Longer term this moves into the database, managed by the content team.
 */
export interface LessonDefinition {
  slug: string;
  title: string;
  /** Total steps (explain, explore and exercise). */
  steps: number;
  /** Exercise step index -> the id of the single correct option. */
  answers: Readonly<Record<number, string>>;
  badgeId: string;
}

export const OPTION_IDS = ['a', 'b', 'c'] as const;

export const LESSONS: readonly LessonDefinition[] = [
  { slug: 'anatomy-of-an-image-ad', title: 'Anatomy of an image ad', steps: 5, answers: { 3: 'b', 4: 'a' }, badgeId: 'image-ad-anatomist' },
  { slug: 'video-first-five-seconds', title: 'Video ads: the first five seconds', steps: 4, answers: { 2: 'b', 3: 'a' }, badgeId: 'hook-writer' },
  { slug: 'calls-to-action-that-click', title: 'Calls to action that get clicked', steps: 4, answers: { 2: 'b', 3: 'a' }, badgeId: 'button-whisperer' },
  { slug: 'gamified-ads-and-friction', title: 'Gamified ads and friction', steps: 3, answers: { 1: 'a', 2: 'a' }, badgeId: 'friction-fixer' },
  { slug: 'carousel-ads-one-idea-per-card', title: 'Carousel ads: one idea per card', steps: 4, answers: { 2: 'a', 3: 'a' }, badgeId: 'card-sharp' },
];

/** Awarded once every lesson above is passed. */
export const GRADUATE_BADGE_ID = 'garage-graduate';

export const BADGE_TITLES: Readonly<Record<string, string>> = {
  'image-ad-anatomist': 'Image ad anatomist',
  'hook-writer': 'Hook writer',
  'button-whisperer': 'Button whisperer',
  'friction-fixer': 'Friction fixer',
  'card-sharp': 'Card sharp',
  [GRADUATE_BADGE_ID]: 'Garage graduate',
};

/** Percentage of exercises that must be right to pass a lesson. */
export const PASS_MARK = 70;

export const findLesson = (slug: string): LessonDefinition | undefined => LESSONS.find((l) => l.slug === slug);

export const exerciseSteps = (lesson: LessonDefinition): number[] =>
  Object.keys(lesson.answers)
    .map(Number)
    .sort((a, b) => a - b);

export interface GradeResult {
  /** 0 to 100, rounded. */
  score: number;
  passed: boolean;
  /** Per exercise: whether the submitted answer was right. The key itself is never returned. */
  results: { step: number; correct: boolean }[];
}

/** Pure grading. Unanswered exercises count as wrong. */
export function gradeLesson(lesson: LessonDefinition, answers: Readonly<Record<string, string>>): GradeResult {
  const steps = exerciseSteps(lesson);
  const results = steps.map((step) => ({ step, correct: answers[String(step)] === lesson.answers[step] }));
  const right = results.filter((r) => r.correct).length;
  const score = steps.length === 0 ? 100 : Math.round((right / steps.length) * 100);
  return { score, passed: score >= PASS_MARK, results };
}
