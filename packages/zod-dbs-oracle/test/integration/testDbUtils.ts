import fs from 'fs/promises';
import path from 'path';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { ZodDbsDatabaseClient, ZodDbsProviderConfig } from 'zod-dbs-core';

import { createClient } from '../../src/client.js';

export interface TestDbContext {
  container: StartedTestContainer;
  client: ZodDbsDatabaseClient;
}

let _clientInstance: ZodDbsDatabaseClient | null = null;

export const getClient = () => {
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
    schemaName: 'ZODDBS',
  };
};

const waitForDbToBeReady = async (
  client: ZodDbsDatabaseClient,
  timeoutMs: number = 10 * 60_000 // default 10 minutes
) => {
  // Retry connect + simple query until the database is fully ready
  const startedAt = Date.now();

  // small initial delay to let the PDB open
  await new Promise((r) => setTimeout(r, 5_000));
  let lastError: unknown = null;

  while (Date.now() - startedAt < timeoutMs) {
    try {
      await client.connect();
      // Simple sanity check query
      await client.query('SELECT 1 FROM dual');
      break; // success
    } catch (err) {
      lastError = err;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  if (Date.now() - startedAt >= timeoutMs) {
    throw new Error(
      `Oracle did not become ready in time: ${String(lastError)}`
    );
  }
};

export async function setupTestDb(): Promise<TestDbContext> {
  const schemaPath = path.resolve(import.meta.dirname, './schema.sql');

  // Use the community Oracle XE image via GenericContainer
  const container = await new GenericContainer('gvenzl/oracle-free:23.9-slim')
    .withExposedPorts(1521)
    // Required env vars for gvenzl/oracle-xe
    .withEnvironment({
      ORACLE_PASSWORD: 'YourStrong!Passw0rd1', // sets SYS, SYSTEM, PDBADMIN password
      APP_USER: 'zoddbs', // creates an application user
      APP_USER_PASSWORD: 'YourStrong!Passw0rd1',
      // NOTE: Do not set ORACLE_DATABASE for XE; XEPDB1 already exists by default and
      // setting it to XEPDB1 causes ORA-65012 (PDB already exists) during init.
    })
    .withStartupTimeout(10 * 60_000)
    .withWaitStrategy(Wait.forListeningPorts())
    .start();

  const host = container.getHost();
  const port = container.getMappedPort(1521);

  const client = await createClient({
    host,
    port,
    database: 'FREEPDB1',
    user: 'zoddbs',
    password: 'YourStrong!Passw0rd1',
  });

  await waitForDbToBeReady(client);

  // Create schema
  const schemaSql = await fs.readFile(schemaPath, 'utf8');
  await client.query(schemaSql);

  _clientInstance = client;

  return { container, client };
}

export async function teardownTestDb(ctx: TestDbContext) {
  await ctx?.client?.end();
  await ctx?.container?.stop();
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
