import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../../src/app.module.js';
import { configureApp } from '../../src/bootstrap.js';
import type { PlanId } from '../../src/plans/plan-catalog.js';
import { EntitlementsService } from '../../src/plans/entitlements.service.js';

/** Env for a hermetic app: in-memory SQLite, fixed secret, no Stripe. Applied before the module is built. */
export function applyTestEnv(overrides: Record<string, string | undefined> = {}): void {
  const env: Record<string, string | undefined> = {
    NODE_ENV: 'test',
    DATABASE_TYPE: 'sqlite',
    SQLITE_PATH: ':memory:',
    DATABASE_URL: undefined,
    DATABASE_SYNCHRONIZE: 'true',
    JWT_ACCESS_SECRET: 'test-secret-test-secret-test-secret-123456',
    SWAGGER_ENABLED: 'false',
    STRIPE_SECRET_KEY: undefined,
    STRIPE_WEBHOOK_SECRET: undefined,
    STRIPE_PRICE_PRO: undefined,
    STRIPE_PRICE_ULTRA: undefined,
    ...overrides,
  };
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

export interface TestApp {
  app: NestExpressApplication;
  http: () => ReturnType<typeof request>;
  close: () => Promise<void>;
}

export type Override = (builder: ReturnType<typeof Test.createTestingModule>) => ReturnType<typeof Test.createTestingModule>;

/** Boots the real app (same pipes, filters and prefix as production) against an in-memory database. */
export async function createTestApp(
  options: { env?: Record<string, string | undefined>; override?: Override } = {},
): Promise<TestApp> {
  applyTestEnv(options.env);
  let builder = Test.createTestingModule({ imports: [AppModule] });
  if (options.override) builder = options.override(builder);
  const moduleRef = await builder.compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>({ rawBody: true });
  configureApp(app);
  await app.init();
  // Listen once on an ephemeral port. Otherwise supertest binds a new listener per request.
  await app.listen(0);

  return {
    app,
    http: () => request(app.getHttpServer()),
    close: () => app.close(),
  };
}

let counter = 0;

/** Registers a fresh user and returns their tokens. Emails are unique per call. */
export async function registerUser(
  t: TestApp,
  overrides: { email?: string; password?: string; displayName?: string } = {},
): Promise<{ accessToken: string; refreshToken: string; userId: string; email: string; password: string }> {
  counter += 1;
  const email = overrides.email ?? `user${counter}-${Date.now()}@example.com`;
  const password = overrides.password ?? 'correct-horse-battery';
  const response = await t.http().post('/api/v1/auth/register').send({ email, password, displayName: overrides.displayName });
  if (response.status !== 201) throw new Error(`register failed: ${response.status} ${JSON.stringify(response.body)}`);
  return {
    accessToken: response.body.accessToken,
    refreshToken: response.body.refreshToken,
    userId: response.body.user.id,
    email,
    password,
  };
}

export const bearer = (token: string) => ({ Authorization: `Bearer ${token}` });

/** Puts a user on a plan directly, as a verified payment webhook would. */
export async function grantPlan(t: TestApp, userId: string, planId: PlanId): Promise<void> {
  await t.app.get(EntitlementsService).applySubscription({
    userId,
    planId,
    status: 'active',
    customerId: `cus_${userId.slice(0, 8)}`,
    subscriptionId: `sub_${userId.slice(0, 8)}`,
    currentPeriodEnd: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    cancelAtPeriodEnd: false,
    occurredAt: new Date(),
  });
}
