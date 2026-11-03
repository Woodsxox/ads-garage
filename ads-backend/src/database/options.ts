import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { DataSourceOptions } from 'typeorm';
import type { AppConfig } from '../config/configuration.js';
import { ENTITIES } from './entities.js';

/**
 * PostgreSQL is the real database. SQLite (better-sqlite3) exists so the API runs and tests with
 * zero setup. Entities stick to portable column types so both work: varchar, int, boolean,
 * simple-json and plain dates. Schema changes in production go through migrations, never `synchronize`.
 */
export function buildDataSourceOptions(db: AppConfig['db']): DataSourceOptions {
  if (db.type === 'postgres') {
    return {
      type: 'postgres',
      url: db.url,
      ssl: db.ssl ? { rejectUnauthorized: true } : false,
      entities: ENTITIES,
      synchronize: db.synchronize,
    };
  }

  if (db.sqlitePath !== ':memory:') mkdirSync(dirname(db.sqlitePath), { recursive: true });
  return { type: 'better-sqlite3', database: db.sqlitePath, entities: ENTITIES, synchronize: db.synchronize };
}
