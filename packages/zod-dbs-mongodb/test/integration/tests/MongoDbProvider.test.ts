import type { ZodDbsProviderConfig } from 'zod-dbs-core';

import { MongoDbProvider } from '../../../src/MongoDbProvider.js';
import { getClient, getConnectionConfig } from '../testDbUtils.js';

let baseConfig: ZodDbsProviderConfig;

beforeAll(async () => {
  baseConfig = getConnectionConfig();
  const client = getClient();

  const db = client.driver.db(baseConfig.database);

  // Seed: create a collection with validator
  await db.createCollection('users', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['_id', 'email', 'createdAt'],
        properties: {
          _id: { bsonType: 'objectId' },
          email: { bsonType: 'string' },
          createdAt: { bsonType: 'date' },
          profile: {
            bsonType: 'object',
            properties: {
              displayName: { bsonType: 'string' },
              age: { bsonType: 'int' },
            },
          },
          tags: { bsonType: 'array', items: { bsonType: 'string' } },
        },
      },
    },
  });
});

it('returns raw schema column information', async () => {
  const provider = new MongoDbProvider();
  const info = await provider.fetchSchemaInfo(baseConfig);

  expect(info).toBeDefined();
  expect(info.length).toBeGreaterThan(0);

  // Remove undefined keys for stable snapshots
  info.forEach((column) => {
    (Object.keys(column) as (keyof typeof column)[]).forEach((key) => {
      if (column[key] === undefined) delete column[key];
    });
  });

  expect(info).toMatchSnapshot('rawColumns');
});

it('returns schema models', async () => {
  const provider = new MongoDbProvider();
  const info = await provider.getSchemaInformation(baseConfig);

  expect(info).toBeDefined();
  expect(info.tables).toBeDefined();
  expect(info.tables.length).toBeGreaterThan(0);

  const users = info.tables.find((t) => t.name === 'users');
  expect(users).toBeDefined();
  expect(users!.columns.length).toBeGreaterThan(0);
  expect(users).toMatchSnapshot('usersTable');
});
