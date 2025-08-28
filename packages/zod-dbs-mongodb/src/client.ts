import { MongoClient } from 'mongodb';

import type { ZodDbsConnectionConfig } from 'zod-dbs-core';

import { ZodDbsMongoDbClient } from './types.js';

const createConnectionUri = (config: ZodDbsConnectionConfig) => {
  let uri = `mongodb://`;

  if (config.user) {
    uri += encodeURIComponent(config.user);
    if (config.password) {
      uri += `:${encodeURIComponent(config.password)}`;
    }

    uri += '@';
  }

  uri += config.host || 'localhost';
  uri += `:${config.port || 27017}`;

  return uri;
};

export async function createClient(
  config: ZodDbsConnectionConfig
): Promise<ZodDbsMongoDbClient> {
  const uri = createConnectionUri(config);

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
