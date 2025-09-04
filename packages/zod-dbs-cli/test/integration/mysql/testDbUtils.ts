import fs from 'fs/promises';
import path from 'path';
import { MySqlContainer } from '@testcontainers/mysql';
import {
  createConnectionString,
  ZodDbsDatabaseClient,
  ZodDbsProviderConfig,
} from 'zod-dbs-core';
import { createClient } from 'zod-dbs-mysql';

import { getProviderOutputDir } from '../utils.js';

export interface TestDbContext {
  container: { stop(): Promise<unknown> };
  client: ZodDbsDatabaseClient;
}

let _clientInstance: ZodDbsDatabaseClient | null = null;

export const getClient = (): ZodDbsDatabaseClient => {
  if (!_clientInstance) {
    throw new Error('Client has not been initialized. Call setupTestDb first.');
  }
  return _clientInstance;
};

export const getConnectionConfig = (): ZodDbsProviderConfig => {
  const client = getClient();

  return {
    host: client.config.host,
    port: client.config.port,
    database: client.config.database,
    user: client.config.user,
    password: client.config.password,
    schemaName: 'test',
    protocol: client.config.protocol || 'postgresql',
  };
};

export const getClientConnectionString = (): string => {
  return createConnectionString(getConnectionConfig());
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

  _clientInstance = client;

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
  getProviderOutputDir('mysql', testSuite, subPath);
