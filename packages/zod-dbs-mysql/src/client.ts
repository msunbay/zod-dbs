import { createConnection } from 'mysql2/promise';
import { logDebug } from 'zod-dbs-core';

import type { ZodDbsDatabaseClient, ZodDbsProviderConfig } from 'zod-dbs-core';

export const createClient = async (
  config: ZodDbsProviderConfig
): Promise<ZodDbsDatabaseClient> => {
  logDebug('Creating MySQL client', config);

  const client = config.connectionString
    ? await createConnection(config.connectionString)
    : await createConnection({
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
  };
};
