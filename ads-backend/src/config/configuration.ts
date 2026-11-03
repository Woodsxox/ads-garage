import { randomBytes } from 'node:crypto';

export type NodeEnv = 'development' | 'test' | 'production';
export type DatabaseType = 'sqlite' | 'postgres';

/** Typed, validated configuration. Read it through `ConfigService<AppConfig, true>`. */
export interface AppConfig {
  nodeEnv: NodeEnv;
  port: number;
  /** Public URL of the web app. Used for CORS defaults and billing redirects. */
  appUrl: string;
  corsOrigins: string[];
  trustProxy: boolean;
  swaggerEnabled: boolean;
  throttle: { ttlMs: number; limit: number };
  db: {
    type: DatabaseType;
    url: string | undefined;
    ssl: boolean;
    sqlitePath: string;
    synchronize: boolean;
  };
  jwt: { accessSecret: string; accessTtlSec: number; refreshTtlSec: number };
  stripe: {
    secretKey: string | undefined;
    webhookSecret: string | undefined;
    priceByPlan: { pro: string | undefined; ultra: string | undefined };
  };
  ai: { provider: 'mock' };
}

export const API_PREFIX = 'api/v1';

function str(env: NodeJS.ProcessEnv, key: string): string | undefined {
  const value = env[key]?.trim();
  return value ? value : undefined;
}

function int(
  env: NodeJS.ProcessEnv,
  key: string,
  fallback: number,
  errors: string[],
  min = 1,
): number {
  const raw = str(env, key);
  if (raw === undefined) return fallback;
  const n = Number(raw);
  if (!Number.isInteger(n) || n < min) {
    errors.push(`${key} must be an integer >= ${min} (got "${raw}")`);
    return fallback;
  }
  return n;
}

function bool(env: NodeJS.ProcessEnv, key: string, fallback: boolean, errors: string[]): boolean {
  const raw = str(env, key)?.toLowerCase();
  if (raw === undefined) return fallback;
  if (['true', '1', 'yes'].includes(raw)) return true;
  if (['false', '0', 'no'].includes(raw)) return false;
  errors.push(`${key} must be true or false (got "${raw}")`);
  return fallback;
}

/**
 * Reads and validates the environment once, at startup. Every problem is reported together so a
 * misconfigured deploy fails fast with a complete list instead of one error per restart.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const errors: string[] = [];

  const rawEnv = str(env, 'NODE_ENV') ?? 'development';
  if (!['development', 'test', 'production'].includes(rawEnv)) {
    errors.push(`NODE_ENV must be development, test or production (got "${rawEnv}")`);
  }
  const nodeEnv = (['development', 'test', 'production'].includes(rawEnv) ? rawEnv : 'development') as NodeEnv;
  const production = nodeEnv === 'production';

  const appUrl = (str(env, 'APP_URL') ?? 'http://localhost:3000').replace(/\/+$/, '');
  const corsOrigins = (str(env, 'CORS_ORIGINS') ?? appUrl)
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
  if (corsOrigins.includes('*')) errors.push('CORS_ORIGINS must list explicit origins, not "*"');

  // Database: DATABASE_URL means Postgres unless DATABASE_TYPE says otherwise.
  const dbUrl = str(env, 'DATABASE_URL');
  const dbTypeRaw = str(env, 'DATABASE_TYPE') ?? (dbUrl ? 'postgres' : 'sqlite');
  if (!['sqlite', 'postgres'].includes(dbTypeRaw)) {
    errors.push(`DATABASE_TYPE must be sqlite or postgres (got "${dbTypeRaw}")`);
  }
  const dbType = (dbTypeRaw === 'postgres' ? 'postgres' : 'sqlite') as DatabaseType;
  if (dbType === 'postgres' && !dbUrl) errors.push('DATABASE_URL is required when DATABASE_TYPE=postgres');
  if (production && dbType === 'sqlite') {
    errors.push('SQLite is for local development and tests. Set DATABASE_URL to a Postgres database in production');
  }
  const synchronize = bool(env, 'DATABASE_SYNCHRONIZE', dbType === 'sqlite', errors);
  if (production && synchronize) {
    errors.push('DATABASE_SYNCHRONIZE must be false in production. Use migrations');
  }

  // Secrets: a random per-boot default is fine for development, never for production.
  let accessSecret = str(env, 'JWT_ACCESS_SECRET');
  if (!accessSecret) {
    if (production) errors.push('JWT_ACCESS_SECRET is required in production');
    accessSecret = randomBytes(48).toString('base64url');
  } else if (accessSecret.length < 32) {
    errors.push('JWT_ACCESS_SECRET must be at least 32 characters');
  }

  const config: AppConfig = {
    nodeEnv,
    port: int(env, 'PORT', 4000, errors),
    appUrl,
    corsOrigins,
    trustProxy: bool(env, 'TRUST_PROXY', false, errors),
    swaggerEnabled: bool(env, 'SWAGGER_ENABLED', !production, errors),
    throttle: {
      ttlMs: int(env, 'THROTTLE_TTL_MS', 60_000, errors),
      limit: int(env, 'THROTTLE_LIMIT', 120, errors),
    },
    db: {
      type: dbType,
      url: dbUrl,
      ssl: bool(env, 'DATABASE_SSL', false, errors),
      sqlitePath: str(env, 'SQLITE_PATH') ?? 'data/ads-garage.sqlite',
      synchronize,
    },
    jwt: {
      accessSecret,
      accessTtlSec: int(env, 'JWT_ACCESS_TTL_SECONDS', 15 * 60, errors, 60),
      refreshTtlSec: int(env, 'JWT_REFRESH_TTL_SECONDS', 30 * 24 * 60 * 60, errors, 60),
    },
    stripe: {
      secretKey: str(env, 'STRIPE_SECRET_KEY'),
      webhookSecret: str(env, 'STRIPE_WEBHOOK_SECRET'),
      priceByPlan: { pro: str(env, 'STRIPE_PRICE_PRO'), ultra: str(env, 'STRIPE_PRICE_ULTRA') },
    },
    ai: { provider: 'mock' },
  };

  if (config.stripe.secretKey && !config.stripe.webhookSecret) {
    errors.push('STRIPE_WEBHOOK_SECRET is required when STRIPE_SECRET_KEY is set');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid configuration:\n - ${errors.join('\n - ')}`);
  }
  return config;
}
