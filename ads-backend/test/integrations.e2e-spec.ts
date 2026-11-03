import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { IntegrationsService } from '../src/integrations/integrations.service.js';
import { sampleDesign } from './helpers/sample-design.js';
import { bearer, createTestApp, grantPlan, registerUser, type TestApp } from './helpers/test-app.js';

describe('integrations (e2e)', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(async () => {
    await t.close();
  });

  const as = (token: string) => ({
    get: (url: string) => t.http().get(`/api/v1${url}`).set(bearer(token)),
    post: (url: string, body?: Record<string, unknown>) => t.http().post(`/api/v1${url}`).set(bearer(token)).send(body),
    del: (url: string) => t.http().delete(`/api/v1${url}`).set(bearer(token)),
  });

  async function proUser() {
    const user = await registerUser(t);
    await grantPlan(t, user.userId, 'pro');
    return { ...user, api: as(user.accessToken) };
  }

  const campaign = (projectId: string, over: Record<string, unknown> = {}) => ({
    projectId,
    platformId: 'google-ads',
    name: 'Spring sale',
    objective: 'traffic',
    dailyBudget: 12.5,
    startDate: '2099-03-01',
    endDate: '2099-03-31',
    audience: 'Home workshop owners',
    ...over,
  });

  it('requires authentication', async () => {
    await t.http().get('/api/v1/integrations/platforms').expect(401);
  });

  it('lists platforms and their specs for any signed-in user', async () => {
    const user = await registerUser(t);
    const res = await as(user.accessToken).get('/integrations/platforms').expect(200);
    expect(res.body.map((p: { id: string }) => p.id)).toEqual(['google-ads', 'youtube', 'tiktok', 'meta']);
  });

  describe('plan gate', () => {
    it('lets Starter look but not connect or submit', async () => {
      const user = await registerUser(t);
      const api = as(user.accessToken);
      expect((await api.get('/integrations/accounts').expect(200)).body).toEqual([]);
      expect((await api.get('/integrations/campaigns').expect(200)).body).toEqual([]);

      const connect = await api.post('/integrations/accounts/google-ads/connect').expect(403);
      expect(connect.body).toMatchObject({ code: 'PLAN_REQUIRED', details: { required: 'pro', current: 'starter' } });
      await api.post('/integrations/campaigns', campaign('11111111-1111-4111-8111-111111111111')).expect(403);
    });
  });

  describe('accounts', () => {
    it('connects, reconnects without duplicating, and flags the connection as simulated', async () => {
      const { api } = await proUser();
      const first = await api.post('/integrations/accounts/google-ads/connect').expect(200);
      expect(first.body).toMatchObject({ platformId: 'google-ads', accountName: 'Garage Demo Advertiser', simulated: true });
      await api.post('/integrations/accounts/google-ads/connect').expect(200);
      await api.post('/integrations/accounts/meta/connect').expect(200);
      const list = await api.get('/integrations/accounts').expect(200);
      expect(list.body.map((a: { platformId: string }) => a.platformId)).toEqual(['google-ads', 'meta']);
    });

    it('rejects an unknown platform', async () => {
      const { api } = await proUser();
      await api.post('/integrations/accounts/myspace/connect').expect(400);
    });

    it('disconnects, even after a downgrade, and 404s when nothing is connected', async () => {
      const user = await proUser();
      await user.api.post('/integrations/accounts/tiktok/connect').expect(200);
      await grantPlan(t, user.userId, 'starter');
      await user.api.del('/integrations/accounts/tiktok').expect(204);
      const again = await user.api.del('/integrations/accounts/tiktok').expect(404);
      expect(again.body.code).toBe('ACCOUNT_NOT_FOUND');
    });

    it('keeps accounts private to their owner', async () => {
      const a = await proUser();
      const b = await proUser();
      await a.api.post('/integrations/accounts/google-ads/connect').expect(200);
      expect((await b.api.get('/integrations/accounts').expect(200)).body).toEqual([]);
    });
  });

  describe('campaigns', () => {
    async function ready(designOver: Record<string, unknown> = {}, platform = 'google-ads') {
      const user = await proUser();
      await user.api.post(`/integrations/accounts/${platform}/connect`).expect(200);
      const project = await user.api.post('/projects', sampleDesign(designOver)).expect(201);
      return { ...user, projectId: project.body.id as string };
    }

    it('submits a campaign and returns it in review, with money as dollars', async () => {
      const { api, projectId } = await ready();
      const res = await api.post('/integrations/campaigns', campaign(projectId)).expect(201);
      expect(res.body).toMatchObject({
        name: 'Spring sale',
        platformId: 'google-ads',
        designId: projectId,
        designName: 'Spring tune-up',
        dailyBudget: 12.5,
        status: 'in_review',
        simulated: true,
      });
      const list = await api.get('/integrations/campaigns').expect(200);
      expect(list.body).toHaveLength(1);
    });

    it('progresses through review, approved and running on the simulated timeline', async () => {
      const { api, userId, projectId } = await ready();
      await api.post('/integrations/campaigns', campaign(projectId)).expect(201);
      const svc = t.app.get(IntegrationsService);
      const at = (ms: number) => svc.listCampaigns(userId, new Date(Date.now() + ms)).then((c) => c[0].status);
      expect(await at(0)).toBe('in_review');
      expect(await at(9_000)).toBe('approved');
      expect(await at(20_000)).toBe('running');
    });

    it('needs the platform to be connected first', async () => {
      const user = await proUser();
      const project = await user.api.post('/projects', sampleDesign()).expect(201);
      const res = await user.api.post('/integrations/campaigns', campaign(project.body.id)).expect(409);
      expect(res.body.code).toBe('ACCOUNT_NOT_CONNECTED');
    });

    it('blocks a design the platform would reject, and says why', async () => {
      const { api, projectId } = await ready({}, 'tiktok');
      const res = await api.post('/integrations/campaigns', campaign(projectId, { platformId: 'tiktok' })).expect(422);
      expect(res.body.code).toBe('CAMPAIGN_CHECKS_FAILED');
      expect(res.body.details.map((c: { id: string }) => c.id)).toContain('size');
    });

    it('blocks an over-long headline', async () => {
      const long = sampleDesign() as { elements: Record<string, unknown>[] };
      long.elements[1].text = 'A headline that is far too long for this platform';
      const { api, projectId } = await ready(long);
      const res = await api.post('/integrations/campaigns', campaign(projectId)).expect(422);
      expect(res.body.details.map((c: { id: string }) => c.id)).toEqual(['headline']);
    });

    it('will not use someone else\'s design', async () => {
      const owner = await proUser();
      const project = await owner.api.post('/projects', sampleDesign()).expect(201);
      const thief = await proUser();
      await thief.api.post('/integrations/accounts/google-ads/connect').expect(200);
      await thief.api.post('/integrations/campaigns', campaign(project.body.id)).expect(404);
    });

    it.each([
      ['an end before the start', { startDate: '2099-03-10', endDate: '2099-03-01' }],
      ['an end in the past', { startDate: '2020-01-01', endDate: '2020-02-01' }],
      ['a date that does not exist', { endDate: '2099-02-31' }],
    ])('rejects %s', async (_label, over) => {
      const { api, projectId } = await ready();
      const res = await api.post('/integrations/campaigns', campaign(projectId, over)).expect(422);
      expect(res.body.code).toBe('INVALID_CAMPAIGN_DATES');
    });

    it.each([
      ['a budget under $1', { dailyBudget: 0.5 }],
      ['a budget with sub-cent precision', { dailyBudget: 12.345 }],
      ['an unknown objective', { objective: 'vibes' }],
      ['a date in the wrong format', { startDate: '03/01/2099' }],
      ['an unknown field', { spendLimitOverride: 1 }],
    ])('rejects %s', async (_label, over) => {
      const { api, projectId } = await ready();
      await api.post('/integrations/campaigns', campaign(projectId, over)).expect(400);
    });

    it('keeps the campaign, with its design name, if the design is deleted', async () => {
      const { api, projectId } = await ready();
      await api.post('/integrations/campaigns', campaign(projectId)).expect(201);
      await api.del(`/projects/${projectId}`).expect(204);
      const list = await api.get('/integrations/campaigns').expect(200);
      expect(list.body[0]).toMatchObject({ designId: null, designName: 'Spring tune-up' });
    });
  });
});
