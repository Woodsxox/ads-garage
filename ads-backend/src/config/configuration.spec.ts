import { describe, expect, it } from 'vitest';
import { loadConfig } from './configuration.js';

const SECRET = 'x'.repeat(40);
const dev = (extra: Record<string, string> = {}) => ({ JWT_ACCESS_SECRET: SECRET, ...extra }) as NodeJS.ProcessEnv;
const prod = (extra: Record<string, string> = {}) =>
  ({ NODE_ENV: 'production', JWT_ACCESS_SECRET: SECRET, DATABASE_URL: 'postgres://u:p@h:5432/d', ...extra }) as NodeJS.ProcessEnv;

describe('loadConfig', () => {
  it('has safe local defaults: SQLite, synchronize, Swagger on, one CORS origin', () => {
    const c = loadConfig(dev());
    expect(c).toMatchObject({ nodeEnv: 'development', port: 4000, swaggerEnabled: true, corsOrigins: ['http://localhost:3000'] });
    expect(c.db).toMatchObject({ type: 'sqlite', synchronize: true });
  });

  it('uses Postgres when DATABASE_URL is set, with synchronize off', () => {
    expect(loadConfig(dev({ DATABASE_URL: 'postgres://u:p@h/d' })).db).toMatchObject({ type: 'postgres', synchronize: false });
  });

  it('generates a random secret in development, different each time', () => {
    const a = loadConfig({} as NodeJS.ProcessEnv).jwt.accessSecret;
    const b = loadConfig({} as NodeJS.ProcessEnv).jwt.accessSecret;
    expect(a.length).toBeGreaterThanOrEqual(32);
    expect(a).not.toBe(b);
  });

  it('accepts a complete production configuration', () => {
    const c = loadConfig(prod());
    expect(c).toMatchObject({ nodeEnv: 'production', swaggerEnabled: false });
    expect(c.db).toMatchObject({ type: 'postgres', synchronize: false });
  });

  it('reports every production problem at once', () => {
    let message = '';
    try {
      loadConfig({ NODE_ENV: 'production' } as NodeJS.ProcessEnv);
    } catch (error) {
      message = (error as Error).message;
    }
    expect(message).toMatch(/SQLite is for local development/);
    expect(message).toMatch(/JWT_ACCESS_SECRET is required in production/);
  });

  it.each([
    ['a short secret', dev({ JWT_ACCESS_SECRET: 'short' }), /at least 32 characters/],
    ['a wildcard CORS origin', dev({ CORS_ORIGINS: '*' }), /explicit origins/],
    ['a non-numeric port', dev({ PORT: 'abc' }), /PORT must be an integer/],
    ['an unknown NODE_ENV', dev({ NODE_ENV: 'staging' }), /NODE_ENV must be/],
    ['postgres without a URL', dev({ DATABASE_TYPE: 'postgres' }), /DATABASE_URL is required/],
    ['a bad boolean', dev({ TRUST_PROXY: 'maybe' }), /TRUST_PROXY must be true or false/],
    ['synchronize in production', prod({ DATABASE_SYNCHRONIZE: 'true' }), /must be false in production/],
    ['a Stripe key with no webhook secret', dev({ STRIPE_SECRET_KEY: 'sk_test_x' }), /STRIPE_WEBHOOK_SECRET is required/],
  ])('rejects %s', (_label, env, pattern) => {
    expect(() => loadConfig(env)).toThrow(pattern);
  });

  it('normalises origins and the app URL, dropping trailing slashes', () => {
    const c = loadConfig(dev({ APP_URL: 'https://app.example.com/', CORS_ORIGINS: 'https://a.example.com/, https://b.example.com' }));
    expect(c.appUrl).toBe('https://app.example.com');
    expect(c.corsOrigins).toEqual(['https://a.example.com', 'https://b.example.com']);
  });
});
