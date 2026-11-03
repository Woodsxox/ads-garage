import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { LESSONS } from '../src/learning/lesson-catalog.js';
import { bearer, createTestApp, registerUser, type TestApp } from './helpers/test-app.js';

describe('learning (e2e)', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(async () => {
    await t.close();
  });

  const submit = (token: string, slug: string, answers: Record<string, string>) =>
    t.http().post(`/api/v1/learning/lessons/${slug}/submit`).set(bearer(token)).send({ answers });

  it('requires authentication', async () => {
    await t.http().get('/api/v1/learning/lessons').expect(401);
  });

  it('lists lessons with empty progress and never exposes answer keys', async () => {
    const user = await registerUser(t);
    const res = await t.http().get('/api/v1/learning/lessons').set(bearer(user.accessToken)).expect(200);
    expect(res.body).toHaveLength(LESSONS.length);
    expect(res.body[0]).toMatchObject({ slug: 'anatomy-of-an-image-ad', steps: 5, exerciseCount: 2, progress: null });
    expect(JSON.stringify(res.body)).not.toMatch(/answers|correct/);
  });

  it('records progress forward only and rejects steps outside the lesson', async () => {
    const user = await registerUser(t);
    const put = (step: number) => t.http().put('/api/v1/learning/lessons/anatomy-of-an-image-ad/progress').set(bearer(user.accessToken)).send({ step });
    expect((await put(3).expect(200)).body.furthestStep).toBe(3);
    expect((await put(1).expect(200)).body.furthestStep).toBe(3);
    await put(5).expect(400);
    await put(-1).expect(400);
    await t.http().put('/api/v1/learning/lessons/nope/progress').set(bearer(user.accessToken)).send({ step: 0 }).expect(404);
  });

  it('grades on the server: a pass completes the lesson and awards its badge once', async () => {
    const user = await registerUser(t);
    const pass = await submit(user.accessToken, 'anatomy-of-an-image-ad', { '3': 'b', '4': 'a' }).expect(200);
    expect(pass.body).toMatchObject({ score: 100, passed: true, completed: true, bestScore: 100 });
    expect(pass.body.newBadges.map((b: { badgeId: string }) => b.badgeId)).toEqual(['image-ad-anatomist']);
    expect(JSON.stringify(pass.body)).not.toMatch(/answers/);

    const again = await submit(user.accessToken, 'anatomy-of-an-image-ad', { '3': 'b', '4': 'a' }).expect(200);
    expect(again.body.newBadges).toEqual([]);

    const badges = await t.http().get('/api/v1/learning/badges').set(bearer(user.accessToken)).expect(200);
    expect(badges.body).toHaveLength(1);
    expect(badges.body[0]).toMatchObject({ badgeId: 'image-ad-anatomist', title: 'Image ad anatomist' });
  });

  it('keeps the best score, counts attempts, and a failing attempt earns nothing', async () => {
    const user = await registerUser(t);
    const fail = await submit(user.accessToken, 'gamified-ads-and-friction', { '1': 'a', '2': 'c' }).expect(200);
    expect(fail.body).toMatchObject({ score: 50, passed: false, completed: false, newBadges: [] });
    expect(fail.body.results).toEqual([{ step: 1, correct: true }, { step: 2, correct: false }]);

    await submit(user.accessToken, 'gamified-ads-and-friction', { '1': 'a', '2': 'a' }).expect(200);
    // A later worse attempt must not lower the best score or undo completion.
    const worse = await submit(user.accessToken, 'gamified-ads-and-friction', {}).expect(200);
    expect(worse.body).toMatchObject({ score: 0, completed: true, bestScore: 100 });

    const lessons = await t.http().get('/api/v1/learning/lessons').set(bearer(user.accessToken)).expect(200);
    const gamified = lessons.body.find((l: { slug: string }) => l.slug === 'gamified-ads-and-friction');
    expect(gamified.progress).toMatchObject({ attempts: 3, bestScore: 100, completed: true });
  });

  it('rejects answers that are not part of the lesson instead of grading them', async () => {
    const user = await registerUser(t);
    await submit(user.accessToken, 'anatomy-of-an-image-ad', { '0': 'a' }).expect(400);
    await submit(user.accessToken, 'anatomy-of-an-image-ad', { '3': 'z' }).expect(400);
    await submit(user.accessToken, 'does-not-exist', {}).expect(404);
    await t.http().post('/api/v1/learning/lessons/anatomy-of-an-image-ad/submit').set(bearer(user.accessToken)).send({}).expect(400);
  });

  it('awards the graduate badge once every lesson is passed', async () => {
    const user = await registerUser(t);
    let last: { newBadges: { badgeId: string }[] } | undefined;
    for (const lesson of LESSONS) {
      const answers = Object.fromEntries(Object.entries(lesson.answers).map(([step, option]) => [step, option]));
      last = (await submit(user.accessToken, lesson.slug, answers).expect(200)).body;
    }
    expect(last!.newBadges.map((b) => b.badgeId)).toEqual([LESSONS.at(-1)!.badgeId, 'garage-graduate']);
    const badges = await t.http().get('/api/v1/learning/badges').set(bearer(user.accessToken)).expect(200);
    expect(badges.body).toHaveLength(LESSONS.length + 1);
  });

  it('keeps one learner\'s progress separate from another\'s', async () => {
    const a = await registerUser(t);
    const b = await registerUser(t);
    await submit(a.accessToken, 'anatomy-of-an-image-ad', { '3': 'b', '4': 'a' }).expect(200);
    const lessons = await t.http().get('/api/v1/learning/lessons').set(bearer(b.accessToken)).expect(200);
    expect(lessons.body.every((l: { progress: unknown }) => l.progress === null)).toBe(true);
    expect((await t.http().get('/api/v1/learning/badges').set(bearer(b.accessToken)).expect(200)).body).toEqual([]);
  });
});
