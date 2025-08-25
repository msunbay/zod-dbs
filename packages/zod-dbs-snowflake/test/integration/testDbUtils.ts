import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

import type {
  ZodDbsDatabaseClient,
  ZodDbsProvider,
  ZodDbsProviderConfig,
} from 'zod-dbs-core';

import { createClient } from '../../src/client.js';
import { SnowflakeProvider } from '../../src/SnowflakeProvider.js';

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

export interface TestDbContext {
  client: ZodDbsDatabaseClient;
}

export const createProvider = (): ZodDbsProvider => new SnowflakeProvider();

let _client: ZodDbsDatabaseClient | null = null;

export const getClient = () => {
  if (!_client) throw new Error('Client not initialized');
  return _client;
};

export const getConnectionConfig = (): ZodDbsProviderConfig => {
  const client = getClient();
  return {
    host: client.config.host,
    port: client.config.port,
    database: client.config.database,
    user: client.config.user,
    password: client.config.password,
    schemaName: client.config.schemaName,
  } as any;
};

export async function setupTestDb() {
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

  _client = client;
  return { client };
}

export async function teardownTestDb(ctx: { client: ZodDbsDatabaseClient }) {
  await ctx?.client?.end();
}

export const getOutputDir = (testSuite: string, subPath = ''): string =>
  path.resolve(import.meta.dirname, `./output/`, testSuite, subPath);
