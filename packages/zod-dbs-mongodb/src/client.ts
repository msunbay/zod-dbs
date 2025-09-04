import { MongoClient } from 'mongodb';
import { createConnectionString, logDebug } from 'zod-dbs-core';

import type { ZodDbsProviderConfig } from 'zod-dbs-core';

import { ZodDbsMongoDbClient } from './types.js';

export async function createClient(
  config: ZodDbsProviderConfig
): Promise<ZodDbsMongoDbClient> {
  const uri = createConnectionString({
    protocol: 'mongodb',
    ...config,
    database: undefined,
  });

  logDebug('Creating MongoDB client', {
    uri,
    directConnection: config.directConnection,
    replicaSet: config.replicaSet,
  });

  const client = new MongoClient(uri, {
    directConnection: config.directConnection,
    replicaSet: config.replicaSet,
  });

  let connected = false;

  return {
    config,
    async connect() {
      if (!connected) {
        await client.connect();
        connected = true;
      }
    },
    async query(_stmt: string, _params?: any[]) {
      // MongoDB is not SQL; this client is only used by the provider directly via driver APIs.
      throw new Error('MongoDB client does not support raw SQL queries');
    },
    async end() {
      if (connected) {
        await client.close();
        connected = false;
      }
    },
    get driver() {
      return client;
    },
  };
}
