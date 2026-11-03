import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { AiProvider } from '../src/ai/ai.provider.js';
import { AiService } from '../src/ai/ai.service.js';
import { bearer, createTestApp, grantPlan, registerUser, type TestApp } from './helpers/test-app.js';

describe('ai (e2e)', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(async () => {
    await t.close();
  });

  const copy = (token: string, body: Record<string, unknown> = { prompt: 'spring sale on hand tools' }) =>
    t.http().post('/api/v1/ai/copy').set(bearer(token)).send(body);
  const usage = async (token: string) => (await t.http().get('/api/v1/ai/usage').set(bearer(token)).expect(200)).body;

  it('requires authentication', async () => {
    await t.http().get('/api/v1/ai/models').expect(401);
    await t.http().post('/api/v1/ai/copy').send({ prompt: 'hello there' }).expect(401);
  });

  it('shows which models the plan can use', async () => {
    const user = await registerUser(t);
    const res = await t.http().get('/api/v1/ai/models').set(bearer(user.accessToken)).expect(200);
    expect(res.body.map((m: { id: string; available: boolean }) => [m.id, m.available])).toEqual([
      ['garage-draft', true],
      ['garage-studio', false],
      ['garage-ultra', false],
    ]);
    expect(JSON.stringify(res.body)).not.toMatch(/provider/);

    await grantPlan(t, user.userId, 'pro');
    const pro = await t.http().get('/api/v1/ai/models').set(bearer(user.accessToken)).expect(200);
    expect(pro.body.map((m: { available: boolean }) => m.available)).toEqual([true, true, false]);
  });

  it('generates variations, charges credits, and reports usage', async () => {
    const user = await registerUser(t);
    expect(await usage(user.accessToken)).toMatchObject({ used: 0, allowance: 50, remaining: 50 });

    const res = await copy(user.accessToken, { prompt: 'spring sale on hand tools', tone: 'bold', variations: 4, maxHeadlineChars: 30 }).expect(200);
    expect(res.body.model).toEqual({ id: 'garage-draft', label: 'Draft' });
    expect(res.body.variations).toHaveLength(4);
    expect(res.body.creditsCharged).toBe(1);
    for (const v of res.body.variations) expect(v.headline.length).toBeLessThanOrEqual(30);
    expect(res.body.usage).toMatchObject({ used: 1, allowance: 50, remaining: 49 });
    expect(await usage(user.accessToken)).toMatchObject({ used: 1 });
  });

  it('uses the best model the plan allows by default, at its own price', async () => {
    const user = await registerUser(t);
    await grantPlan(t, user.userId, 'pro');
    const res = await copy(user.accessToken).expect(200);
    expect(res.body).toMatchObject({ model: { id: 'garage-studio' }, creditsCharged: 2 });
    expect(await usage(user.accessToken)).toMatchObject({ used: 2, allowance: 500 });
  });

  it('refuses a model above the plan, and an unknown one, without charging', async () => {
    const user = await registerUser(t);
    const blocked = await copy(user.accessToken, { prompt: 'spring sale', model: 'garage-ultra' }).expect(403);
    expect(blocked.body).toMatchObject({ code: 'MODEL_REQUIRES_PLAN', details: { required: 'ultra', current: 'starter' } });
    expect((await copy(user.accessToken, { prompt: 'spring sale', model: 'gpt-nope' }).expect(400)).body.code).toBe('UNKNOWN_MODEL');
    expect((await usage(user.accessToken)).used).toBe(0);
  });

  it('validates the request', async () => {
    const user = await registerUser(t);
    await copy(user.accessToken, { prompt: 'x' }).expect(400);
    await copy(user.accessToken, { prompt: 'x'.repeat(501) }).expect(400);
    await copy(user.accessToken, { prompt: 'valid prompt', variations: 6 }).expect(400);
    await copy(user.accessToken, { prompt: 'valid prompt', tone: 'angry' }).expect(400);
    await copy(user.accessToken, { prompt: 'valid prompt', credits: 0 }).expect(400);
    expect((await usage(user.accessToken)).used).toBe(0);
  });

  it('stops at the monthly allowance with 402 and the numbers the app needs', async () => {
    const user = await registerUser(t);
    for (let i = 0; i < 50; i += 1) await copy(user.accessToken).expect(200);
    const res = await copy(user.accessToken).expect(402);
    expect(res.body).toMatchObject({ code: 'AI_QUOTA_EXCEEDED', details: { used: 50, allowance: 50, remaining: 0 } });
    expect(res.body.details.resetsAt).toMatch(/^\d{4}-\d{2}-01T00:00:00\.000Z$/);
  });

  it('never lets parallel requests spend more than the allowance', async () => {
    const user = await registerUser(t);
    const results = await Promise.all(Array.from({ length: 60 }, () => copy(user.accessToken)));
    const ok = results.filter((r) => r.status === 200).length;
    const refused = results.filter((r) => r.status === 402).length;
    expect({ ok, refused }).toEqual({ ok: 50, refused: 10 });
    expect((await usage(user.accessToken)).used).toBe(50);
  });

  it('keeps usage per user and resets each calendar month', async () => {
    const a = await registerUser(t);
    const b = await registerUser(t);
    await copy(a.accessToken).expect(200);
    expect((await usage(b.accessToken)).used).toBe(0);

    const ai = t.app.get(AiService);
    const nextMonth = new Date(Date.UTC(2031, 0, 15));
    expect(await ai.getUsage(a.userId, nextMonth)).toMatchObject({ period: '2031-01', used: 0, remaining: 50, resetsAt: '2031-02-01T00:00:00.000Z' });
    await ai.generateCopy(a.userId, { prompt: 'a future month' }, nextMonth);
    expect((await ai.getUsage(a.userId, nextMonth)).used).toBe(1);
    expect((await usage(a.accessToken)).used).toBe(1); // this month is untouched
  });

  it('refunds the credits when the provider fails', async () => {
    const failing = await createTestApp({
      override: (builder) =>
        builder.overrideProvider(AiProvider).useValue({
          generateCopy: () => Promise.reject(new Error('upstream exploded: secret-internal-detail')),
        }),
    });
    try {
      const user = await registerUser(failing);
      const res = await failing.http().post('/api/v1/ai/copy').set(bearer(user.accessToken)).send({ prompt: 'spring sale' }).expect(502);
      expect(res.body.code).toBe('AI_PROVIDER_ERROR');
      expect(JSON.stringify(res.body)).not.toMatch(/secret-internal-detail/);
      const after = await failing.http().get('/api/v1/ai/usage').set(bearer(user.accessToken)).expect(200);
      expect(after.body.used).toBe(0);
    } finally {
      await failing.close();
    }
  });
});
