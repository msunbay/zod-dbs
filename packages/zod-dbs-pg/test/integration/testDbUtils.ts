import fs from 'fs/promises';
import path from 'path';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { Client } from 'pg';

import { createClient } from '../../src/client.js';

export interface TestDbContext {
  container: StartedPostgreSqlContainer;
  client: Client;
}

let _clientInstance: Client | null = null;

export const getClient = (): Client => {
  if (!_clientInstance) {
    throw new Error('Client has not been initialized. Call setupTestDb first.');
  }
  return _clientInstance;
};

export const getClientConnectionString = (): string => {
  const client = getClient();
  return `postgres://${client.user}:${client.password}@${client.host}:${client.port}/${client.database}`;
};

export const getCliPath = (): string => {
  return path.resolve(import.meta.dirname, '../../index.js');
};

export async function setupTestDb(): Promise<TestDbContext> {
  const schemaPath = path.resolve(import.meta.dirname, './schema.sql');

  const container = await new PostgreSqlContainer('postgres')
    .withDatabase('postgres')
    .withUsername('postgres')
    .withPassword('postgres')
    .withExposedPorts(5432)
    .start();

  const client = createClient({
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

  _clientInstance = client;

  return { container, client };
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
