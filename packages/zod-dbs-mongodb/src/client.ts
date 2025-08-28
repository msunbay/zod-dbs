import { MongoClient } from 'mongodb';

import type { ZodDbsConnectionConfig } from 'zod-dbs-core';

import { ZodDbsMongoDbClient } from './types.js';

export async function createClient(
  config: ZodDbsConnectionConfig
): Promise<ZodDbsMongoDbClient> {
  // Prefer explicit URI (e.g., from Testcontainers getConnectionString) to include replica set params
  const uri = `mongodb://${config.user ? `${encodeURIComponent(config.user)}${config.password ? `:${encodeURIComponent(config.password)}` : ''}@` : ''}${config.host || 'localhost'}:${config.port || 27017}`;
  const client = new MongoClient(uri, {});

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
    // Expose driver for provider-specific logic
    get driver() {
      return client;
    },
  } as ZodDbsMongoDbClient;
}
