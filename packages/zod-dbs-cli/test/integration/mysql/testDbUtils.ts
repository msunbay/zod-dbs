import fs from 'fs/promises';
import path from 'path';
import { MySqlContainer } from '@testcontainers/mysql';
import { createConnectionString, ZodDbsDatabaseClient } from 'zod-dbs-core';
import { createClient } from 'zod-dbs-mysql';

import { getProviderOutputDir } from '../utils.js';

export interface TestDbContext {
  container: { stop(): Promise<unknown> };
  client: ZodDbsDatabaseClient;
}

export const getTestContext = () => {
  const g: any = globalThis as any;

  if (!g.__MYSQL_CTX__) {
    throw new Error('Test context not initialized');
  }

  return g.__MYSQL_CTX__ as TestDbContext;
};

export const getClientConnectionString = (): string => {
  return createConnectionString(getTestContext().client.config);
};

export async function setupTestDb(): Promise<TestDbContext> {
  const schemaPath = path.resolve(import.meta.dirname, './schema.sql');

  const container = await new MySqlContainer('mysql')
    .withDatabase('test')
    .withUsername('test')
    .withRootPassword('test')
    .start();

  const client = await createClient({
    host: container.getHost(),
    port: container.getPort(),
    database: container.getDatabase(),
    user: container.getUsername(),
    password: container.getRootPassword(),
  });

  await client.connect();

  // Create schema
  const schemaSql = await fs.readFile(schemaPath, 'utf8');
  await client.query(schemaSql);

  return { container, client };
}

export async function teardownTestDb(ctx?: TestDbContext) {
  if (!ctx) return;
  await ctx.client.end();
  await ctx.container.stop();
}

export const getOutputDir = (testSuite: string, subPath = ''): string =>
  getProviderOutputDir('mysql', testSuite, subPath);
