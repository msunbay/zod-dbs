import { createConnection } from 'mysql2/promise';
import { ZodDbsConnectionConfig, ZodDbsDatabaseClient } from 'zod-dbs-core';

export const createClient = async (
  options: ZodDbsConnectionConfig
): Promise<ZodDbsDatabaseClient> => {
  const client = await createConnection({
    host: options.host,
    port: options.port,
    user: options.user,
    password: options.password,
    database: options.database,
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
