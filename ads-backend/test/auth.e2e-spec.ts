import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { bearer, createTestApp, registerUser, type TestApp } from './helpers/test-app.js';

describe('auth (e2e)', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(async () => {
    await t.close();
  });

  it('serves a public health check', async () => {
    const res = await t.http().get('/api/v1/health').expect(200);
    expect(res.body).toMatchObject({ status: 'ok', database: 'up' });
    expect(res.headers['x-request-id']).toBeTruthy();
  });

  it('registers, returns tokens and never leaks the password hash', async () => {
    const res = await t.http().post('/api/v1/auth/register').send({ email: 'Ada@Example.com', password: 'a-long-password', displayName: 'Ada' }).expect(201);
    expect(res.body.user).toMatchObject({ email: 'ada@example.com', displayName: 'Ada', role: 'user' });
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|scrypt\$/);
    expect(res.body.accessToken.split('.')).toHaveLength(3);
    expect(res.body.refreshToken).toContain('.');
    expect(Object.keys(res.body).sort()).toEqual(['accessToken', 'expiresIn', 'refreshToken', 'tokenType', 'user']);
  });

  it('rejects a duplicate email regardless of case', async () => {
    await registerUser(t, { email: 'dup@example.com' });
    const res = await t.http().post('/api/v1/auth/register').send({ email: 'DUP@example.com', password: 'another-password' }).expect(409);
    expect(res.body.code).toBe('EMAIL_TAKEN');
  });

  it('validates input and uses one error shape', async () => {
    const res = await t.http().post('/api/v1/auth/register').send({ email: 'not-an-email', password: 'short', extra: 1 }).expect(400);
    expect(res.body).toMatchObject({ statusCode: 400, error: 'Bad Request', path: '/api/v1/auth/register' });
    expect(Array.isArray(res.body.message)).toBe(true);
    expect(res.body.message.join(' ')).toMatch(/email/);
    expect(res.body.message.join(' ')).toMatch(/extra should not exist/);
    expect(res.body.requestId).toBeTruthy();
  });

  it('returns 400 for malformed JSON and 413 for an oversized body, not a 500', async () => {
    const bad = await t.http().post('/api/v1/auth/login').set('Content-Type', 'application/json').send('{"email": ').expect(400);
    expect(bad.body).toMatchObject({ statusCode: 400, error: 'Bad Request' });

    const huge = JSON.stringify({ email: 'a@example.com', password: 'x'.repeat(9 * 1024 * 1024) });
    const big = await t.http().post('/api/v1/auth/login').set('Content-Type', 'application/json').send(huge).expect(413);
    expect(big.body).toMatchObject({ statusCode: 413, error: 'Payload Too Large' });
  });

  it('logs in with the right password and gives the same error for wrong password and unknown email', async () => {
    const user = await registerUser(t);
    await t.http().post('/api/v1/auth/login').send({ email: user.email, password: user.password }).expect(200);
    const wrong = await t.http().post('/api/v1/auth/login').send({ email: user.email, password: 'wrong-password-x' }).expect(401);
    const unknown = await t.http().post('/api/v1/auth/login').send({ email: 'nobody@example.com', password: 'wrong-password-x' }).expect(401);
    expect(wrong.body.code).toBe('INVALID_CREDENTIALS');
    expect(unknown.body.message).toBe(wrong.body.message);
  });

  it('protects private routes and accepts a valid token', async () => {
    await t.http().get('/api/v1/users/me').expect(401);
    await t.http().get('/api/v1/users/me').set(bearer('garbage.token.value')).expect(401);
    const user = await registerUser(t, { displayName: 'Grace' });
    const me = await t.http().get('/api/v1/users/me').set(bearer(user.accessToken)).expect(200);
    expect(me.body).toMatchObject({ id: user.userId, email: user.email, displayName: 'Grace' });
  });

  it('rotates refresh tokens and revokes the whole session set when one is reused', async () => {
    const user = await registerUser(t);
    const first = await t.http().post('/api/v1/auth/refresh').send({ refreshToken: user.refreshToken }).expect(200);
    expect(first.body.refreshToken).not.toBe(user.refreshToken);

    // The original token was consumed. Replaying it is treated as theft.
    const replay = await t.http().post('/api/v1/auth/refresh').send({ refreshToken: user.refreshToken }).expect(401);
    expect(replay.body.code).toBe('REFRESH_TOKEN_REUSED');

    // ...which also kills the newer token issued from it.
    await t.http().post('/api/v1/auth/refresh').send({ refreshToken: first.body.refreshToken }).expect(401);
  });

  it('rejects tampered refresh tokens', async () => {
    const user = await registerUser(t);
    const [id] = user.refreshToken.split('.');
    await t.http().post('/api/v1/auth/refresh').send({ refreshToken: `${id}.not-the-secret` }).expect(401);
    await t.http().post('/api/v1/auth/refresh').send({ refreshToken: 'nodot' }).expect(401);
  });

  it('logout revokes the refresh token', async () => {
    const user = await registerUser(t);
    await t.http().post('/api/v1/auth/logout').set(bearer(user.accessToken)).send({ refreshToken: user.refreshToken }).expect(204);
    await t.http().post('/api/v1/auth/refresh').send({ refreshToken: user.refreshToken }).expect(401);
  });

  it('deleting the account needs the password and removes the user', async () => {
    const user = await registerUser(t);
    await t.http().delete('/api/v1/users/me').set(bearer(user.accessToken)).send({ password: 'not-the-password' }).expect(401);
    await t.http().delete('/api/v1/users/me').set(bearer(user.accessToken)).send({ password: user.password }).expect(204);
    await t.http().post('/api/v1/auth/login').send({ email: user.email, password: user.password }).expect(401);
    // Refresh tokens went with the user (foreign-key cascade).
    await t.http().post('/api/v1/auth/refresh').send({ refreshToken: user.refreshToken }).expect(401);
  });
});
