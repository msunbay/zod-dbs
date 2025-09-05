import fs from 'fs/promises';
import path from 'path';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { createConnectionString, ZodDbsDatabaseClient } from 'zod-dbs-core';
import { createClient } from 'zod-dbs-pg';

import { getProviderOutputDir } from '../utils.js';

export interface TestDbContext {
  container: { stop(): Promise<unknown> };
  client: ZodDbsDatabaseClient;
}

export const getTestContext = () => {
  const g: any = globalThis as any;

  if (!g.__PG_CTX__) {
    throw new Error('Test context not initialized');
  }

  return g.__PG_CTX__ as TestDbContext;
};

export const getClientConnectionString = (): string => {
  return createConnectionString(getTestContext().client.config);
};

export async function setupTestDb(): Promise<TestDbContext> {
  const schemaPath = path.resolve(import.meta.dirname, './schema.sql');

  const container = await new PostgreSqlContainer('postgres')
    .withDatabase('test')
    .withUsername('test')
    .withPassword('test')
    .start();

  const client = await createClient({
    host: container.getHost(),
    port: container.getPort(),
    database: container.getDatabase(),
    user: container.getUsername(),
    password: container.getPassword(),
  });

  await client.connect();

  // Create schema
  const schemaSql = await fs.readFile(schemaPath, 'utf8');
  await client.query(schemaSql);

  return { container, client };
}

export async function teardownTestDb(ctx: TestDbContext) {
  await ctx.client.end();
  await ctx.container.stop();
}

export const getOutputDir = (testSuite: string, subPath = ''): string =>
  getProviderOutputDir('pg', testSuite, subPath);
