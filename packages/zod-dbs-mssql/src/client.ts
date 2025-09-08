import mssql from 'mssql';
import { logDebug } from 'zod-dbs-core';

import type { ZodDbsDatabaseClient, ZodDbsProviderConfig } from 'zod-dbs-core';

export const createClient = async (
  config: ZodDbsProviderConfig
): Promise<ZodDbsDatabaseClient> => {
  logDebug('Creating MSSQL client', config);

  let pool: mssql.ConnectionPool;

  return {
    connect: async () => {
      if (config.connectionString) {
        // Use connection string if provided
        // Example: "Server=localhost;Database=myDb;User Id=myUsername;Password=myPassword;"
        pool = await mssql.connect(config.connectionString);
      } else
        pool = await mssql.connect({
          server: config.host || 'localhost',
          port: config.port,
          user: config.user,
          password: config.password,
          database: config.database,
          options: { trustServerCertificate: true },
        });
    },
    query: async <T>(query: string) => {
      if (!pool) throw new Error('MSSQL client not connected');

      const result = await pool.query<T>(query);
      return result.recordset as T;
    },
    end: async () => {
      await pool?.close();
    },
  };
};
