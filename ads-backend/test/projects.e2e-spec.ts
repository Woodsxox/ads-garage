import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { sampleDesign } from './helpers/sample-design.js';
import { bearer, createTestApp, grantPlan, registerUser, type TestApp } from './helpers/test-app.js';

describe('projects (e2e)', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(async () => {
    await t.close();
  });

  const create = (token: string, body: Record<string, unknown> = sampleDesign()) =>
    t.http().post('/api/v1/projects').set(bearer(token)).send(body);

  it('requires authentication', async () => {
    await t.http().get('/api/v1/projects').expect(401);
    await t.http().post('/api/v1/projects').send(sampleDesign()).expect(401);
  });

  it('creates and reads back a design in the editor shape, with server-owned fields', async () => {
    const user = await registerUser(t);
    const created = await create(user.accessToken).expect(201);
    expect(created.body).toMatchObject({ name: 'Spring tune-up', formatId: '300x250', status: 'draft', templateId: 'tpl-spring-sale' });
    expect(created.body.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(created.body.elements).toHaveLength(4);
    expect(new Date(created.body.createdAt).toString()).not.toBe('Invalid Date');
    expect(created.body).not.toHaveProperty('userId');
    expect(created.body).not.toHaveProperty('content');

    const got = await t.http().get(`/api/v1/projects/${created.body.id}`).set(bearer(user.accessToken)).expect(200);
    expect(got.body).toEqual(created.body);
  });

  it('ignores a client-supplied id, owner and timestamps', async () => {
    const user = await registerUser(t);
    const other = await registerUser(t);
    const res = await create(user.accessToken, sampleDesign({ id: 'design-mine', userId: other.userId, createdAt: '2000-01-01T00:00:00.000Z' })).expect(201);
    expect(res.body.id).not.toBe('design-mine');
    expect(new Date(res.body.createdAt).getFullYear()).toBeGreaterThan(2020);
    await t.http().get(`/api/v1/projects/${res.body.id}`).set(bearer(other.accessToken)).expect(404);
  });

  it('rejects an invalid design with a list of problems', async () => {
    const user = await registerUser(t);
    const design = sampleDesign() as { elements: Record<string, unknown>[] };
    design.elements[3].href = 'javascript:alert(1)';
    const res = await create(user.accessToken, design).expect(422);
    expect(res.body.code).toBe('INVALID_DESIGN');
    expect(res.body.details.join()).toMatch(/elements\[3\]\.href/);
  });

  it('keeps designs private: other users get 404, never 403 or the data', async () => {
    const owner = await registerUser(t);
    const intruder = await registerUser(t);
    const { body } = await create(owner.accessToken).expect(201);

    await t.http().get(`/api/v1/projects/${body.id}`).set(bearer(intruder.accessToken)).expect(404);
    await t.http().put(`/api/v1/projects/${body.id}`).set(bearer(intruder.accessToken)).send(sampleDesign({ name: 'Hijacked' })).expect(404);
    await t.http().delete(`/api/v1/projects/${body.id}`).set(bearer(intruder.accessToken)).expect(404);
    await t.http().post(`/api/v1/projects/${body.id}/duplicate`).set(bearer(intruder.accessToken)).expect(404);

    const list = await t.http().get('/api/v1/projects').set(bearer(intruder.accessToken)).expect(200);
    expect(list.body.items).toEqual([]);
    const still = await t.http().get(`/api/v1/projects/${body.id}`).set(bearer(owner.accessToken)).expect(200);
    expect(still.body.name).toBe('Spring tune-up');
  });

  it('rejects a malformed id', async () => {
    const user = await registerUser(t);
    await t.http().get('/api/v1/projects/not-a-uuid').set(bearer(user.accessToken)).expect(400);
  });

  it('replaces, duplicates and deletes', async () => {
    const user = await registerUser(t);
    const { body } = await create(user.accessToken).expect(201);

    const updated = await t.http().put(`/api/v1/projects/${body.id}`).set(bearer(user.accessToken)).send(sampleDesign({ name: 'Renamed', status: 'ready' })).expect(200);
    expect(updated.body).toMatchObject({ id: body.id, name: 'Renamed', status: 'ready' });
    expect(updated.body.createdAt).toBe(body.createdAt);

    const copy = await t.http().post(`/api/v1/projects/${body.id}/duplicate`).set(bearer(user.accessToken)).expect(201);
    expect(copy.body).toMatchObject({ name: 'Renamed (copy)', status: 'draft' });
    expect(copy.body.id).not.toBe(body.id);
    expect(copy.body.elements).toEqual(updated.body.elements);

    await t.http().delete(`/api/v1/projects/${body.id}`).set(bearer(user.accessToken)).expect(204);
    await t.http().get(`/api/v1/projects/${body.id}`).set(bearer(user.accessToken)).expect(404);
    await t.http().delete(`/api/v1/projects/${body.id}`).set(bearer(user.accessToken)).expect(404);
  });

  it('searches, filters, sorts and paginates', async () => {
    const user = await registerUser(t);
    for (const [name, status] of [['Alpha sale', 'ready'], ['beta banner', 'draft'], ['100%_off', 'draft'], ['Gamma', 'ready']] as const) {
      await create(user.accessToken, sampleDesign({ name, status })).expect(201);
    }
    const get = (qs: string) => t.http().get(`/api/v1/projects?${qs}`).set(bearer(user.accessToken)).expect(200);

    expect((await get('q=ALPHA')).body.items.map((p: { name: string }) => p.name)).toEqual(['Alpha sale']);
    expect((await get('status=ready&sort=name')).body.items.map((p: { name: string }) => p.name)).toEqual(['Alpha sale', 'Gamma']);
    // % and _ are literal characters in a search, not wildcards.
    expect((await get(`q=${encodeURIComponent('%')}`)).body.items.map((p: { name: string }) => p.name)).toEqual(['100%_off']);
    expect((await get(`q=${encodeURIComponent('_')}`)).body.items.map((p: { name: string }) => p.name)).toEqual(['100%_off']);

    const page = await get('sort=name&limit=2&offset=1');
    expect(page.body).toMatchObject({ total: 4, limit: 2, offset: 1 });
    expect(page.body.items).toHaveLength(2);
    await t.http().get('/api/v1/projects?limit=999').set(bearer(user.accessToken)).expect(400);
    await t.http().get('/api/v1/projects?status=nope').set(bearer(user.accessToken)).expect(400);
  });

  describe('plan limits', () => {
    it('stops a Starter user at the project limit, with a code the app can act on', async () => {
      const user = await registerUser(t);
      for (let i = 0; i < 10; i += 1) await create(user.accessToken, sampleDesign({ name: `d${i}` })).expect(201);
      const res = await create(user.accessToken).expect(403);
      expect(res.body).toMatchObject({ code: 'PROJECT_LIMIT_REACHED', details: { limit: 10 } });
    });

    it('lets Pro save more', async () => {
      const user = await registerUser(t);
      await grantPlan(t, user.userId, 'pro');
      for (let i = 0; i < 11; i += 1) await create(user.accessToken, sampleDesign({ name: `p${i}` })).expect(201);
    });

    const pro = { formatId: '300x600', width: 300, height: 600 };

    it('blocks Pro-only formats on Starter and allows them on Pro', async () => {
      const starter = await registerUser(t);
      const res = await create(starter.accessToken, sampleDesign(pro)).expect(403);
      expect(res.body).toMatchObject({ code: 'FORMAT_REQUIRES_PRO', details: { formatId: '300x600' } });

      const proUser = await registerUser(t);
      await grantPlan(t, proUser.userId, 'pro');
      await create(proUser.accessToken, sampleDesign(pro)).expect(201);
    });

    it('does not let a Starter user switch an existing design to a Pro format', async () => {
      const user = await registerUser(t);
      const { body } = await create(user.accessToken).expect(201);
      await t.http().put(`/api/v1/projects/${body.id}`).set(bearer(user.accessToken)).send(sampleDesign(pro)).expect(403);
    });

    it('keeps a Pro design editable after a downgrade', async () => {
      const user = await registerUser(t);
      await grantPlan(t, user.userId, 'pro');
      const { body } = await create(user.accessToken, sampleDesign(pro)).expect(201);
      await grantPlan(t, user.userId, 'starter');
      await t.http().put(`/api/v1/projects/${body.id}`).set(bearer(user.accessToken)).send(sampleDesign({ ...pro, name: 'Still mine' })).expect(200);
    });
  });
});
