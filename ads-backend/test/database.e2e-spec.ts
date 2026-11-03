import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DataSource } from 'typeorm';
import { ENTITIES } from '../src/database/entities.js';
import { createTestApp, type TestApp } from './helpers/test-app.js';

describe('database (e2e)', () => {
  let t: TestApp;
  beforeAll(async () => {
    t = await createTestApp();
  });
  afterAll(async () => {
    await t.close();
  });

  it('creates a table for every listed entity, with unique names', () => {
    const metadata = t.app.get(DataSource).entityMetadatas;
    expect(metadata).toHaveLength(ENTITIES.length);
    const tables = metadata.map((m) => m.tableName);
    expect(new Set(tables).size).toBe(tables.length);
    expect(tables.sort()).toEqual(
      ['ai_usage', 'billing_events', 'campaigns', 'connected_accounts', 'lesson_progress', 'projects', 'refresh_tokens', 'subscriptions', 'user_badges', 'users'].sort(),
    );
  });

  it('turns on foreign keys, so deleting a user really cascades', async () => {
    const [row] = await t.app.get(DataSource).query('PRAGMA foreign_keys');
    expect(row.foreign_keys).toBe(1);
  });
});
