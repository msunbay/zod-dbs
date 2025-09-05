import fs from 'fs/promises';
import path from 'path';
import {
  MSSQLServerContainer,
  StartedMSSQLServerContainer,
} from '@testcontainers/mssqlserver';
import { ZodDbsDatabaseClient, ZodDbsProviderConfig } from 'zod-dbs-core';

import { createClient } from '../../src/client.js';

export interface TestDbContext {
  container: StartedMSSQLServerContainer;
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
  return getClient().config;
};

export async function setupTestDb(): Promise<TestDbContext> {
  const schemaPath = path.resolve(import.meta.dirname, './schema.sql');

  const container = await new MSSQLServerContainer(
    'mcr.microsoft.com/mssql/server:2022-latest'
  )
    .withDatabase('master')
    .withPassword('YourStrong!Passw0rd')
    .acceptLicense()
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

  _clientInstance = client;

  return { container, client };
}

export async function teardownTestDb(ctx?: TestDbContext) {
  await ctx?.client.end();
  await ctx?.container.stop();
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
