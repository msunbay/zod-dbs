import fs from 'node:fs/promises';
import path from 'node:path';
import dotenv from 'dotenv';
import { createClient } from 'zod-dbs-snowflake';

import type { ZodDbsProviderConfig } from 'zod-dbs-core';

dotenv.config({
  path: path.resolve(import.meta.dirname, './.env'),
  quiet: true,
});

const SNOWFLAKE_CONFIG = {
  host: process.env.SNOWFLAKE_HOST,
  password: process.env.SNOWFLAKE_PASSWORD,
  token: process.env.SNOWFLAKE_TOKEN,
  user: process.env.SNOWFLAKE_USER,
  database: process.env.SNOWFLAKE_DATABASE,
  schemaName: process.env.SNOWFLAKE_SCHEMA_NAME,
  account: process.env.SNOWFLAKE_ACCOUNT,
  role: process.env.SNOWFLAKE_ROLE,
} as ZodDbsProviderConfig;

export const getOutputDir = (testSuite: string, subPath = ''): string =>
  path.resolve(import.meta.dirname, `./output/`, testSuite, subPath);

export async function setupTestDb() {
  const IS_CONFIGURED = !!process.env.SNOWFLAKE_HOST;

  if (!IS_CONFIGURED) {
    return { config: {}, teardown: async () => {} };
  }

  const client = await createClient(SNOWFLAKE_CONFIG);
  await client.connect();

  // Optionally apply schema if requested
  if (process.env.SNOWFLAKE_APPLY_SCHEMA === 'true') {
    const schemaPath = path.resolve(import.meta.dirname, './schema.sql');
    const sql = await fs.readFile(schemaPath, 'utf8');

    for (const stmt of sql
      .split(/;\s*\n/g)
      .map((s) => s.trim())
      .filter(Boolean)) {
      await client.query(stmt);
    }
  }

  return {
    config: SNOWFLAKE_CONFIG,
    client,
    teardown: async () => await client.end(),
  };
}
