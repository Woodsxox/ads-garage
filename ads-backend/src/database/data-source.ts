import 'reflect-metadata';
import { existsSync } from 'node:fs';
import { DataSource } from 'typeorm';
import { loadConfig } from '../config/configuration.js';
import { buildDataSourceOptions } from './options.js';

/**
 * Entry point for the TypeORM CLI (`npm run migration:*`). The app does not use this file.
 * Migrations target PostgreSQL: generate them against a real Postgres database, never SQLite.
 */
// The app reads .env through Nest's ConfigModule. The CLI runs outside Nest, so read it here.
if (existsSync('.env')) process.loadEnvFile('.env');

const { db } = loadConfig();
if (db.type !== 'postgres' && process.env.ALLOW_NON_POSTGRES_MIGRATIONS !== 'true') {
  throw new Error('Migrations are for PostgreSQL. Set DATABASE_URL (see .env.example).');
}

export default new DataSource({
  ...buildDataSourceOptions({ ...db, synchronize: false }),
  migrations: ['dist/database/migrations/*.js'],
  migrationsTableName: 'migrations',
});
