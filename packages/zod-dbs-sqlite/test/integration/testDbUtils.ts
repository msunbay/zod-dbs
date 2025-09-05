import fs from 'fs/promises';
import path from 'path';
import { ZodDbsDatabaseClient } from 'zod-dbs-core';

import { createClient } from '../../src/client.js';

export interface TestDbContext {
  client: ZodDbsDatabaseClient;
  dbPath: string;
}

export const getCliPath = (): string => {
  return path.resolve(import.meta.dirname, '../../index.js');
};

export async function setupTestDb(): Promise<TestDbContext> {
  const schemaPath = path.resolve(import.meta.dirname, './schema.sql');
  const dbPath = path.resolve(import.meta.dirname, './test.sqlite');

  // Ensure any previous file is removed
  try {
    await fs.rm(dbPath);
  } catch {}

  const client = await createClient({ database: dbPath });
  await client.connect();

  const schemaSql = await fs.readFile(schemaPath, 'utf8');
  await client.query(schemaSql);

  return { client, dbPath };
}

export async function teardownTestDb(ctx?: TestDbContext) {
  if (!ctx) return;
  try {
    await ctx.client?.end?.();
  } catch {}
  try {
    if (ctx.dbPath) await fs.rm(ctx.dbPath);
  } catch {}
}

export const getOutputDir = (testSuite: string, subPath = ''): string =>
  path.resolve(import.meta.dirname, `./output/`, testSuite, subPath);

export async function getOutputFiles(dir: string): Promise<string[]> {
  let results: string[] = [];
  const list = await fs.readdir(dir, { withFileTypes: true });

  for (const file of list) {
    const filePath = path.join(dir, file.name);

    if (file.isDirectory()) {
      results = results.concat(await getOutputFiles(filePath));
    } else {
      results.push(filePath);
    }
  }

  return results;
}

export async function deleteOutputFiles(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true, force: true });
}
