import { MongoDBContainer } from '@testcontainers/mongodb';
import { createClient } from 'zod-dbs-mongodb';

import type { TestDbContext } from '../utils/types.js';

import { seedTestData } from './data.js';

export async function setupTestDb(): Promise<TestDbContext> {
  const container = await new MongoDBContainer('mongo:7').start();

  const config = {
    host: container.getHost(),
    port: container.getFirstMappedPort(),
    database: 'testdb',
    replicaSet: 'rs0',
    directConnection: true,
  };

  const client = await createClient(config);

  await client.connect();

  await seedTestData(client, config.database);

  return {
    config,
    teardown: async () => {
      await client.end();
      await container.stop();
    },
  };
}
