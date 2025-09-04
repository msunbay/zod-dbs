import { createConnection } from 'mysql2/promise';
import { ZodDbsDatabaseClient, ZodDbsProviderConfig } from 'zod-dbs-core';

export const createClient = async (
  config: ZodDbsProviderConfig
): Promise<ZodDbsDatabaseClient> => {
  const client = await createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
  });

  return {
    connect: async () => {
      return await client.connect();
    },
    query: async <T>(query: string, params: any) => {
      const result = await client.execute(query, params);
      return result[0] as T;
    },
    end: async () => {
      return await client.end();
    },
    config: {
      host: client.config.host,
      port: client.config.port,
      database: client.config.database,
      user: client.config.user,
      password: client.config.password,
    },
  };
};
