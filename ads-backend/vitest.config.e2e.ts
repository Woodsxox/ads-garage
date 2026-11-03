import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['test/**/*.e2e-spec.ts'],
    // Each file boots a full app against an in-memory database.
    testTimeout: 20000,
  },
});
