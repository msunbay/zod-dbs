import path from 'path';
import {
  MongoDBContainer,
  StartedMongoDBContainer,
} from '@testcontainers/mongodb';

import type { ZodDbsDatabaseClient, ZodDbsProviderConfig } from 'zod-dbs-core';

import { createClient } from '../../src/client.js';

export interface TestDbContext {
  container: StartedMongoDBContainer;
  client: ZodDbsDatabaseClient & { driver: any };
}

let _clientInstance: TestDbContext['client'] | null = null;
let _connection: (ZodDbsProviderConfig & { uri?: string }) | null = null;

export const getClient = () => {
  if (!_clientInstance) throw new Error('Client not initialized');
  return _clientInstance;
};

export const getConnectionConfig = (): ZodDbsProviderConfig => {
  if (!_connection) throw new Error('Connection not initialized');
  return { ..._connection } as ZodDbsProviderConfig;
};

export const getCliPath = (): string => {
  return path.resolve(import.meta.dirname, '../../index.js');
};

export async function setupTestDb(): Promise<TestDbContext> {
  const container = await new MongoDBContainer('mongo:7').start();
  const database = 'testdb';

  // Prefer the connection string from Testcontainers to handle replica set params, then add db name
  const baseUri = container.getConnectionString();
  const url = new URL(baseUri);
  url.pathname = `/${database}`;
  url.searchParams.set('replicaSet', 'rs0');
  url.searchParams.set('directConnection', 'true');
  const uri = url.toString();

  const client = (await createClient({ uri } as any)) as any;
  await client.connect();

  // Seed: create a collection with validator
  const db = client.driver.db(database);
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

  _clientInstance = Object.assign(client, {
    config: { ...client.config, uri, database },
  });
  _connection = { database, uri } as any;

  return { container, client: _clientInstance! };
}

export async function teardownTestDb(ctx?: TestDbContext) {
  if (!ctx) return;
  try {
    await ctx.client.end();
  } finally {
    await ctx.container.stop();
  }
}

export const getOutputDir = (testSuite: string, subPath = ''): string =>
  path.resolve(import.meta.dirname, `./output/`, testSuite, subPath);
