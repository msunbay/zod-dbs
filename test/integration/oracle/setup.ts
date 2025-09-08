import { GenericContainer, Wait } from 'testcontainers';
import { createClient } from 'zod-dbs-oracle';

import type { ZodDbsDatabaseClient } from 'zod-dbs-core';
import type { TestDbContext } from '../utils/types.js';

import { seedTestData } from '../utils/db.js';

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

  const config = {
    host,
    port,
    database: 'FREEPDB1',
    user: 'zoddbs',
    password: 'YourStrong!Passw0rd1',
  };

  const client = await createClient(config);

  await waitForDbToBeReady(client);
  await seedTestData('oracle', client);

  return {
    config,
    teardown: async () => {
      await client.end();
      await container.stop();
    },
  };
}
