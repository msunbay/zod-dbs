import path from 'path';
import {
  MongoDBContainer,
  StartedMongoDBContainer,
} from '@testcontainers/mongodb';

import type { ZodDbsProviderConfig } from 'zod-dbs-core';

import { createClient } from '../../src/client.js';
import { ZodDbsMongoDbClient } from '../../src/types.js';

export interface TestDbContext {
  container: StartedMongoDBContainer;
  client: ZodDbsMongoDbClient;
}

let _clientInstance: TestDbContext['client'] | null = null;

export const getClient = () => {
  if (!_clientInstance) throw new Error('Client not initialized');
  return _clientInstance;
};

export const getConnectionConfig = (): ZodDbsProviderConfig => {
  if (!_clientInstance) throw new Error('Connection not initialized');
  return _clientInstance.config;
};

export const getCliPath = (): string => {
  return path.resolve(import.meta.dirname, '../../index.js');
};

export async function setupTestDb(): Promise<TestDbContext> {
  const container = await new MongoDBContainer('mongo:7').start();
  const database = 'testdb';
  const client = await createClient({
    host: container.getHost(),
    port: container.getFirstMappedPort(),
    database,
    replicaSet: 'rs0',
    directConnection: true,
  });

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

  _clientInstance = client;

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
