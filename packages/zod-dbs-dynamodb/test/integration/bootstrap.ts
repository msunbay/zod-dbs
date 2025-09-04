import { setupTestDb, teardownTestDb } from './testDbUtils.js';

const g: any = globalThis as any;

if (!g.__DYNAMO_BOOTSTRAP__) {
  g.__DYNAMO_BOOTSTRAP__ = true;
  g.__DYNAMO_CTX__ = await setupTestDb();

  afterAll(async () => {
    try {
      await teardownTestDb(g.__DYNAMO_CTX__);
    } finally {
      g.__DYNAMO_CTX__ = undefined;
      g.__DYNAMO_BOOTSTRAP__ = undefined;
    }
  });
}
