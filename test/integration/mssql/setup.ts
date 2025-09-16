import { MSSQLServerContainer } from '@testcontainers/mssqlserver';
import { createClient } from 'zod-dbs-mssql';

import type { TestDbContext } from '../utils/types.js';

import { seedTestData } from '../utils/db.js';

export async function setupTestDb(): Promise<TestDbContext> {
  const container = await new MSSQLServerContainer(
    'mcr.microsoft.com/mssql/server:2022-latest'
  )
    .withDatabase('master')
    .withPassword('YourStrong!Passw0rd')
    .acceptLicense()
    .start();

  const config = {
    host: container.getHost(),
    port: container.getPort(),
    database: container.getDatabase(),
    user: container.getUsername(),
    password: container.getPassword(),
  };

  const client = await createClient(config);

  await client.connect();
  await seedTestData('mssql', client);

  return {
    config,
    teardown: async () => {
      await client.end();
      await container.stop();
    },
  };
}
