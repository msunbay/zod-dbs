import fs from 'node:fs/promises';
import path from 'node:path';
import { createClient } from 'zod-dbs-sqlite';

import type { TestDbContext } from '../utils/types.js';

import { seedTestData } from '../utils/db.js';

export const getOutputDir = (testSuite: string, subPath = ''): string =>
  path.resolve(import.meta.dirname, `./output/`, testSuite, subPath);

export async function setupTestDb(): Promise<TestDbContext> {
  const dbPath = path.resolve(import.meta.dirname, './test.sqlite');

  // Ensure any previous file is removed
  try {
    await fs.rm(dbPath);
  } catch {}

  const config = { database: dbPath };

  const client = await createClient(config);
  await client.connect();
  await seedTestData('sqlite', client);

  return {
    config,
    teardown: async () => {
      await client.end();
    },
  };
}
