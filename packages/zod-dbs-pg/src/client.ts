import { Client } from 'pg';
import { ZodDbsConnectionConfig, ZodDbsDatabaseClient } from 'zod-dbs-core';

export const createClient = async (
  options: ZodDbsConnectionConfig
): Promise<ZodDbsDatabaseClient> => {
  const client = new Client({
    user: options.user,
    password: options.password,
    host: options.host,
    port: options.port,
    database: options.database,
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
      protocol: 'postgresql',
    },
  } satisfies ZodDbsDatabaseClient;
};
