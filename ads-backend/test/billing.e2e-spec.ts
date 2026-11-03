import Stripe from 'stripe';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bearer, createTestApp, registerUser, type TestApp } from './helpers/test-app.js';

const WEBHOOK_SECRET = 'whsec_test_secret';
const signer = new Stripe('sk_test_signer_only');

function subscriptionEvent(input: {
  id: string;
  created: number;
  userId?: string;
  planId?: string;
  status: string;
  type?: string;
  subscriptionId?: string;
}): string {
  return JSON.stringify({
    id: input.id,
    object: 'event',
    type: input.type ?? 'customer.subscription.updated',
    created: input.created,
    data: {
      object: {
        id: input.subscriptionId ?? 'sub_test_1',
        object: 'subscription',
        customer: 'cus_test_1',
        status: input.status,
        cancel_at_period_end: false,
        metadata: input.userId ? { userId: input.userId, planId: input.planId ?? 'pro' } : {},
        items: { data: [{ current_period_end: input.created + 30 * 24 * 3600 }] },
      },
    },
  });
}

const sign = (payload: string) => signer.webhooks.generateTestHeaderString({ payload, secret: WEBHOOK_SECRET });
const now = () => Math.floor(Date.now() / 1000);

describe('plans (e2e)', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(async () => {
    await t.close();
  });

  it('lists the plan catalog publicly', async () => {
    const res = await t.http().get('/api/v1/plans').expect(200);
    expect(res.body.map((p: { id: string }) => p.id)).toEqual(['starter', 'pro', 'ultra']);
    expect(res.body[2]).toMatchObject({ id: 'ultra', comingSoon: true });
  });

  it('puts a new user on Starter with Starter limits', async () => {
    const user = await registerUser(t);
    const res = await t.http().get('/api/v1/plans/me').set(bearer(user.accessToken)).expect(200);
    expect(res.body).toMatchObject({ planId: 'starter', subscription: null, limits: { publishing: false, proFormats: false } });
  });

  it('refuses checkout politely when billing is not configured', async () => {
    const user = await registerUser(t);
    const res = await t.http().post('/api/v1/billing/checkout').set(bearer(user.accessToken)).send({ plan: 'pro' }).expect(503);
    expect(res.body.code).toBe('BILLING_NOT_CONFIGURED');
  });

  it('rejects an invalid plan in checkout', async () => {
    const user = await registerUser(t);
    await t.http().post('/api/v1/billing/checkout').set(bearer(user.accessToken)).send({ plan: 'starter' }).expect(400);
  });
});

describe('billing webhooks (e2e, Stripe configured)', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp({ env: { STRIPE_SECRET_KEY: 'sk_test_dummy_key', STRIPE_WEBHOOK_SECRET: WEBHOOK_SECRET } });
  });
  afterAll(async () => {
    await t.close();
  });

  const post = (payload: string, signature = sign(payload)) =>
    t.http().post('/api/v1/billing/webhook').set('Content-Type', 'application/json').set('stripe-signature', signature).send(payload);

  const planOf = async (token: string) => (await t.http().get('/api/v1/plans/me').set(bearer(token))).body.planId as string;

  it('rejects a missing or forged signature', async () => {
    const payload = subscriptionEvent({ id: 'evt_bad', created: now(), status: 'active' });
    await t.http().post('/api/v1/billing/webhook').set('Content-Type', 'application/json').send(payload).expect(400);
    const forged = await post(payload, 't=1,v1=deadbeef');
    expect(forged.status).toBe(400);
    expect(forged.body.code).toBe('INVALID_SIGNATURE');
  });

  it('rejects a payload that was altered after signing', async () => {
    const original = subscriptionEvent({ id: 'evt_tamper', created: now(), status: 'active', userId: 'someone', planId: 'pro' });
    const header = sign(original);
    const altered = original.replace('"pro"', '"ultra"');
    const res = await post(altered, header);
    expect(res.status).toBe(400);
  });

  it('upgrades a user on a verified subscription event, unlocking Pro limits', async () => {
    const user = await registerUser(t);
    const payload = subscriptionEvent({ id: 'evt_up', created: now(), status: 'active', userId: user.userId, planId: 'pro', subscriptionId: 'sub_up' });
    const res = await post(payload).expect(200);
    expect(res.body).toEqual({ received: true, outcome: 'applied' });

    const me = await t.http().get('/api/v1/plans/me').set(bearer(user.accessToken)).expect(200);
    expect(me.body).toMatchObject({ planId: 'pro', limits: { publishing: true, proFormats: true }, subscription: { status: 'active' } });
  });

  it('acknowledges a redelivered event without applying it twice', async () => {
    const user = await registerUser(t);
    const payload = subscriptionEvent({ id: 'evt_dup', created: now(), status: 'active', userId: user.userId, subscriptionId: 'sub_dup' });
    expect((await post(payload).expect(200)).body.outcome).toBe('applied');
    expect((await post(payload).expect(200)).body.outcome).toBe('duplicate');
  });

  it('ignores an older event that arrives after a newer one', async () => {
    const user = await registerUser(t);
    const base = now();
    await post(subscriptionEvent({ id: 'evt_new', created: base, status: 'active', userId: user.userId, subscriptionId: 'sub_ord' })).expect(200);
    const late = await post(subscriptionEvent({ id: 'evt_old', created: base - 3600, status: 'canceled', userId: user.userId, subscriptionId: 'sub_ord' })).expect(200);
    expect(late.body.outcome).toBe('stale');
    expect(await planOf(user.accessToken)).toBe('pro');
  });

  it('downgrades to Starter when the subscription is cancelled, and keeps access while past_due', async () => {
    const user = await registerUser(t);
    const base = now();
    await post(subscriptionEvent({ id: 'evt_a', created: base, status: 'active', userId: user.userId, subscriptionId: 'sub_dg' })).expect(200);
    await post(subscriptionEvent({ id: 'evt_b', created: base + 10, status: 'past_due', userId: user.userId, subscriptionId: 'sub_dg' })).expect(200);
    expect(await planOf(user.accessToken)).toBe('pro');
    await post(subscriptionEvent({ id: 'evt_c', created: base + 20, status: 'canceled', userId: user.userId, subscriptionId: 'sub_dg', type: 'customer.subscription.deleted' })).expect(200);
    expect(await planOf(user.accessToken)).toBe('starter');
  });

  it('finds the user from a known subscription when metadata is missing', async () => {
    const user = await registerUser(t);
    const base = now();
    await post(subscriptionEvent({ id: 'evt_m1', created: base, status: 'active', userId: user.userId, subscriptionId: 'sub_meta' })).expect(200);
    const res = await post(subscriptionEvent({ id: 'evt_m2', created: base + 5, status: 'canceled', subscriptionId: 'sub_meta' })).expect(200);
    expect(res.body.outcome).toBe('applied');
    expect(await planOf(user.accessToken)).toBe('starter');
  });

  it('ignores unrelated event types and unattributable subscriptions', async () => {
    const other = JSON.stringify({ id: 'evt_other', object: 'event', type: 'invoice.paid', created: now(), data: { object: {} } });
    expect((await post(other).expect(200)).body.outcome).toBe('ignored');
    const orphan = subscriptionEvent({ id: 'evt_orphan', created: now(), status: 'active', subscriptionId: 'sub_unknown' });
    expect((await post(orphan).expect(200)).body.outcome).toBe('ignored');
  });

  it('will not start checkout for a plan without a configured price, or for someone already subscribed', async () => {
    const user = await registerUser(t);
    const res = await t.http().post('/api/v1/billing/checkout').set(bearer(user.accessToken)).send({ plan: 'ultra' }).expect(501);
    expect(res.body.code).toBe('PLAN_NOT_PURCHASABLE');

    await post(subscriptionEvent({ id: 'evt_sub', created: now(), status: 'active', userId: user.userId, subscriptionId: 'sub_already' })).expect(200);
    const again = await t.http().post('/api/v1/billing/checkout').set(bearer(user.accessToken)).send({ plan: 'pro' }).expect(409);
    expect(again.body.code).toBe('ALREADY_SUBSCRIBED');
  });

  it('has no portal until a billing account exists', async () => {
    const user = await registerUser(t);
    const res = await t.http().post('/api/v1/billing/portal').set(bearer(user.accessToken)).expect(409);
    expect(res.body.code).toBe('NO_BILLING_ACCOUNT');
  });
});
