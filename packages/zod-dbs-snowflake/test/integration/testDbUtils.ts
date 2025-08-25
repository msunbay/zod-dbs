import fs from 'fs/promises';
import path from 'path';

import type {
  ZodDbsDatabaseClient,
  ZodDbsProvider,
  ZodDbsProviderConfig,
} from 'zod-dbs-core';

import { createClient } from '../../src/client.js';
import { SnowflakeProvider } from '../../src/SnowflakeProvider.js';

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
    schemaName: process.env.SNOWFLAKE_SCHEMA,
  } as any;
};

export async function setupTestDb() {
  // No container for Snowflake; use env credentials
  const host = process.env.SNOWFLAKE_HOST;
  const user = process.env.SNOWFLAKE_USER;
  const password = process.env.SNOWFLAKE_PASSWORD;
  const database = process.env.SNOWFLAKE_DATABASE;
  const schema = process.env.SNOWFLAKE_SCHEMA;

  if (!host || !user || !password || !database || !schema) {
    throw new Error(
      'Snowflake integration requires SNOWFLAKE_HOST, USER, PASSWORD, DATABASE, SCHEMA'
    );
  }

  const client = await createClient({ host, user, password, database } as any);
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
