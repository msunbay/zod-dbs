import { GenericContainer } from 'testcontainers';
import { createClient } from 'zod-dbs-dynamodb';

import type { TestDbContext } from '../utils/types.js';

import { getProviderOutputDir } from '../utils/cli.js';
import { seedTestData } from './data.js';

export const getOutputDir = (testSuite: string, subPath = ''): string =>
  getProviderOutputDir('dynamodb', testSuite, subPath);

export async function setupTestDb(): Promise<TestDbContext> {
  // Use amazon/dynamodb-local image
  const container = await new GenericContainer('amazon/dynamodb-local:latest')
    .withExposedPorts(8000)
    .start();

  const host = container.getHost();
  const port = container.getMappedPort(8000);
  const endpoint = `http://${host}:${port}`;

  const config = {
    endpoint,
    region: 'us-east-1',
    accessKeyId: 'test',
    secretAccessKey: 'test',
  };

  const client = await createClient(config);

  await client.connect();
  await seedTestData(client);

  return {
    config,
    teardown: async () => {
      await client.end();
      await container.stop();
    },
  };
}
