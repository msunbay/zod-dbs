import { setupTestDb, teardownTestDb } from './testDbUtils.js';

const g: any = globalThis as any;

if (!g.__MYSQL_BOOTSTRAP__) {
  g.__MYSQL_BOOTSTRAP__ = true;
  g.__MYSQL_CTX__ = await setupTestDb();

  // Ensure teardown happens once after all tests
  // eslint-disable-next-line no-undef
  afterAll(async () => {
    try {
      await teardownTestDb(g.__MYSQL_CTX__);
    } finally {
      g.__MYSQL_CTX__ = undefined;
      g.__MYSQL_BOOTSTRAP__ = undefined;
    }
  });
}
