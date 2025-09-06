import { setupTestDb, teardownTestDb } from './testDbUtils.js';

const g: any = globalThis as any;

if (!g.__DYNAMODB_BOOTSTRAP__) {
  g.__DYNAMODB_BOOTSTRAP__ = true;
  g.__DYNAMODB_CTX__ = await setupTestDb();

  // Ensure teardown happens once after all tests
  // eslint-disable-next-line no-undef
  afterAll(async () => {
    try {
      await teardownTestDb(g.__DYNAMODB_CTX__);
    } finally {
      g.__DYNAMODB_CTX__ = undefined;
      g.__DYNAMODB_BOOTSTRAP__ = undefined;
    }
  });
}
