import { setupTestDb, teardownTestDb } from './testDbUtils.js';

const g: any = globalThis as any;

if (!g.__PG_BOOTSTRAP__) {
  g.__PG_BOOTSTRAP__ = true;
  g.__PG_CTX__ = await setupTestDb();

  // Ensure teardown happens once after all tests
  // eslint-disable-next-line no-undef
  afterAll(async () => {
    try {
      await teardownTestDb(g.__PG_CTX__);
    } finally {
      g.__PG_CTX__ = undefined;
      g.__PG_BOOTSTRAP__ = undefined;
    }
  });
}
