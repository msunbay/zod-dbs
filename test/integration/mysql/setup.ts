import { MySqlContainer } from '@testcontainers/mysql';
import { createClient } from 'zod-dbs-mysql';

import type { TestDbContext } from '../utils/types.js';

import { getProviderOutputDir } from '../utils/cli.js';
import { seedTestData } from '../utils/db.js';

const PROVIDER_NAME = 'mysql';

export const getOutputDir = (testSuite: string, subPath = ''): string =>
  getProviderOutputDir(PROVIDER_NAME, testSuite, subPath);

export async function setupTestDb(): Promise<TestDbContext> {
  const container = await new MySqlContainer('mysql')
    .withDatabase('test')
    .withUsername('test')
    .withRootPassword('test')
    .start();

  const config = {
    host: container.getHost(),
    port: container.getPort(),
    database: container.getDatabase(),
    user: container.getUsername(),
    password: container.getRootPassword(),
  };

  const client = await createClient(config);

  await client.connect();

  await seedTestData(PROVIDER_NAME, client);

  return {
    config,
    teardown: async () => {
      await client.end();
      await container.stop();
    },
  };
}
