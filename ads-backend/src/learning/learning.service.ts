import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LessonProgress, UserBadge } from './learning.entities.js';
import {
  BADGE_TITLES,
  GRADUATE_BADGE_ID,
  type GradeResult,
  LESSONS,
  type LessonDefinition,
  OPTION_IDS,
  exerciseSteps,
  findLesson,
  gradeLesson,
} from './lesson-catalog.js';

export interface LessonSummary {
  slug: string;
  title: string;
  steps: number;
  exerciseCount: number;
  badgeId: string;
  progress: { furthestStep: number; completed: boolean; bestScore: number | null; attempts: number; completedAt: string | null } | null;
}

export interface BadgeView {
  badgeId: string;
  title: string;
  awardedAt: string;
}

export interface SubmitResult extends GradeResult {
  completed: boolean;
  bestScore: number;
  /** Badges earned by this submission, not ones the user already had. */
  newBadges: BadgeView[];
}

@Injectable()
export class LearningService {
  constructor(
    @InjectRepository(LessonProgress) private readonly progress: Repository<LessonProgress>,
    @InjectRepository(UserBadge) private readonly badges: Repository<UserBadge>,
  ) {}

  async listLessons(userId: string): Promise<LessonSummary[]> {
    const rows = await this.progress.findBy({ userId });
    const bySlug = new Map(rows.map((row) => [row.lessonSlug, row]));
    return LESSONS.map((lesson) => {
      const row = bySlug.get(lesson.slug);
      return {
        slug: lesson.slug,
        title: lesson.title,
        steps: lesson.steps,
        exerciseCount: exerciseSteps(lesson).length,
        badgeId: lesson.badgeId,
        progress: row
          ? {
              furthestStep: row.furthestStep,
              completed: row.completed,
              bestScore: row.bestScore,
              attempts: row.attempts,
              completedAt: row.completedAt?.toISOString() ?? null,
            }
          : null,
      };
    });
  }

  /** Records how far the learner has got. Never moves backwards, so a replay cannot erase progress. */
  async recordStep(userId: string, slug: string, step: number): Promise<LessonSummary['progress']> {
    const lesson = this.requireLesson(slug);
    if (step >= lesson.steps) {
      throw new BadRequestException({ message: `Step must be between 0 and ${lesson.steps - 1}`, code: 'INVALID_STEP' });
    }
    const row = await this.getOrCreate(userId, slug);
    if (step > row.furthestStep) {
      row.furthestStep = step;
      await this.progress.save(row);
    }
    return this.view(row);
  }

  /** Grades the exercises on the server, updates the best score and awards badges. */
  async submit(userId: string, slug: string, answers: Record<string, string>): Promise<SubmitResult> {
    const lesson = this.requireLesson(slug);
    this.assertAnswersWellFormed(lesson, answers);

    const grade = gradeLesson(lesson, answers);
    const row = await this.getOrCreate(userId, slug);
    row.attempts += 1;
    row.bestScore = Math.max(row.bestScore ?? 0, grade.score);
    row.furthestStep = Math.max(row.furthestStep, lesson.steps - 1);
    if (grade.passed && !row.completed) {
      row.completed = true;
      row.completedAt = new Date();
    }
    await this.progress.save(row);

    const newBadges: BadgeView[] = [];
    if (grade.passed) {
      const earned = await this.award(userId, lesson.badgeId);
      if (earned) newBadges.push(earned);
      if (await this.hasCompletedAll(userId)) {
        const graduate = await this.award(userId, GRADUATE_BADGE_ID);
        if (graduate) newBadges.push(graduate);
      }
    }
    return { ...grade, completed: row.completed, bestScore: row.bestScore, newBadges };
  }

  async listBadges(userId: string): Promise<BadgeView[]> {
    const rows = await this.badges.find({ where: { userId }, order: { awardedAt: 'ASC' } });
    return rows.map((row) => ({ badgeId: row.badgeId, title: BADGE_TITLES[row.badgeId] ?? row.badgeId, awardedAt: row.awardedAt.toISOString() }));
  }

  private requireLesson(slug: string): LessonDefinition {
    const lesson = findLesson(slug);
    if (!lesson) throw new NotFoundException({ message: 'Lesson not found', code: 'LESSON_NOT_FOUND' });
    return lesson;
  }

  /** Reject nonsense instead of grading it, so a typo in the client is noticed rather than scored as wrong. */
  private assertAnswersWellFormed(lesson: LessonDefinition, answers: Record<string, string>): void {
    const valid = new Set(exerciseSteps(lesson).map(String));
    for (const [step, option] of Object.entries(answers)) {
      if (!valid.has(step)) {
        throw new BadRequestException({ message: `Step ${step} is not an exercise in this lesson`, code: 'INVALID_ANSWERS' });
      }
      if (typeof option !== 'string' || !(OPTION_IDS as readonly string[]).includes(option)) {
        throw new BadRequestException({ message: `Option for step ${step} must be one of ${OPTION_IDS.join(', ')}`, code: 'INVALID_ANSWERS' });
      }
    }
  }

  private async getOrCreate(userId: string, lessonSlug: string): Promise<LessonProgress> {
    const existing = await this.progress.findOneBy({ userId, lessonSlug });
    if (existing) return existing;
    try {
      return await this.progress.save(
        this.progress.create({ userId, lessonSlug, furthestStep: 0, bestScore: null, attempts: 0, completed: false, completedAt: null }),
      );
    } catch {
      // A parallel request created it first. The unique index made this one fail, so read theirs.
      const raced = await this.progress.findOneBy({ userId, lessonSlug });
      if (raced) return raced;
      throw new Error('Could not create lesson progress');
    }
  }

  private async award(userId: string, badgeId: string): Promise<BadgeView | null> {
    if (await this.badges.existsBy({ userId, badgeId })) return null;
    try {
      const saved = await this.badges.save(this.badges.create({ userId, badgeId }));
      return { badgeId, title: BADGE_TITLES[badgeId] ?? badgeId, awardedAt: saved.awardedAt.toISOString() };
    } catch {
      return null; // Awarded by a parallel request.
    }
  }

  private async hasCompletedAll(userId: string): Promise<boolean> {
    const done = await this.progress.countBy({ userId, completed: true });
    return done >= LESSONS.length;
  }

  private view(row: LessonProgress): LessonSummary['progress'] {
    return {
      furthestStep: row.furthestStep,
      completed: row.completed,
      bestScore: row.bestScore,
      attempts: row.attempts,
      completedAt: row.completedAt?.toISOString() ?? null,
    };
  }
}
