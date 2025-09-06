import { Client } from 'pg';
import {
  logDebug,
  ZodDbsDatabaseClient,
  ZodDbsProviderConfig,
} from 'zod-dbs-core';

export const createClient = async (
  config: ZodDbsProviderConfig
): Promise<ZodDbsDatabaseClient> => {
  const client = new Client({
    connectionString: config.connectionString,
    user: config.user,
    password: config.password,
    host: config.host,
    port: config.port,
    database: config.database,
    ssl: config.ssl,
    application_name: 'zod-dbs-pg',
  });

  logDebug('PostgreSQL Client Config:', config);

  return {
    connect: async () => {
      return await client.connect();
    },
    query: async <T>(query: string, params: any) => {
      const result = await client.query(query, params);
      return result.rows as T;
    },
    end: async () => {
      return await client.end();
    },
    config: {
      host: client.host,
      port: client.port,
      database: client.database,
      user: client.user,
      password: client.password,
      ssl: client.ssl,
      protocol: 'postgresql',
    },
  } satisfies ZodDbsDatabaseClient;
};
