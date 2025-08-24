import fs from 'fs/promises';
import path from 'path';
import { MySqlContainer } from '@testcontainers/mysql';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import {
  createConnectionString,
  ZodDbsDatabaseClient,
  ZodDbsProviderConfig,
} from 'zod-dbs-core';
import { createClient as createMysqlClient } from 'zod-dbs-mysql';
import { createClient as createPostgreSqlClient } from 'zod-dbs-pg';

import { ZodDbsProviderName } from '../../src/types.js';

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

export const getCliPath = (): string => {
  return path.resolve(import.meta.dirname, '../../index.js');
};

export async function setupPostgreSql(): Promise<TestDbContext> {
  const schemaPath = path.resolve(import.meta.dirname, './schema-pg.sql');

  const container = await new PostgreSqlContainer('postgres')
    .withDatabase('test')
    .withUsername('test')
    .withPassword('test')
    .start();

  const client = await createPostgreSqlClient({
    host: container.getHost(),
    port: container.getPort(),
    database: container.getDatabase(),
    user: container.getUsername(),
    password: container.getPassword(),
  });

  _clientInstance = client;

  await client.connect();

  // Create schema
  const schemaSql = await fs.readFile(schemaPath, 'utf8');
  await client.query(schemaSql);

  return { container, client };
}

export async function setupMysql(): Promise<TestDbContext> {
  const schemaPath = path.resolve(import.meta.dirname, './schema-mysql.sql');

  const container = await new MySqlContainer('mysql')
    .withDatabase('test')
    .withUsername('test')
    .withRootPassword('test')
    .start();

  const client = await createMysqlClient({
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

export async function setupTestDb(
  db: ZodDbsProviderName = 'pg'
): Promise<TestDbContext> {
  if (db === 'pg') return setupPostgreSql();
  if (db === 'mysql') return setupMysql();

  throw new Error(`Unsupported database provider: ${db}`);
}

export async function teardownTestDb(ctx: TestDbContext) {
  await ctx.client.end();
  await ctx.container.stop();
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
  await fs.rm(dir, { recursive: true });
}
