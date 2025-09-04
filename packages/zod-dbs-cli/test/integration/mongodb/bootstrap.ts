import { setupTestDb, teardownTestDb } from './testDbUtils.js';

const g: any = globalThis as any;

if (!g.__MONGO_BOOTSTRAP__) {
  g.__MONGO_BOOTSTRAP__ = true;
  g.__MONGO_CTX__ = await setupTestDb();

  // Ensure teardown happens once after all tests
  // eslint-disable-next-line no-undef
  afterAll(async () => {
    try {
      await teardownTestDb(g.__MONGO_CTX__);
    } finally {
      g.__MONGO_CTX__ = undefined;
      g.__MONGO_BOOTSTRAP__ = undefined;
    }
  });
}
