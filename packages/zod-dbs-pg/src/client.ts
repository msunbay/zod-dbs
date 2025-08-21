import { Client } from 'pg';
import {
  createConnectionString,
  ZodDbsConnectionConfig,
  ZodDbsDatabaseClient,
} from 'zod-dbs-core';

export const createClient = async (
  options: ZodDbsConnectionConfig
): Promise<ZodDbsDatabaseClient> => {
  const client = new Client({
    connectionString: createConnectionString(options),
    ssl: options.ssl,
    application_name: 'zod-dbs-pg',
  });

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
    },
  } satisfies ZodDbsDatabaseClient;
};
