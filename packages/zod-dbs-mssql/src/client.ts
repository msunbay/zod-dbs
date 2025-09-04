import mssql from 'mssql';
import { ZodDbsDatabaseClient, ZodDbsProviderConfig } from 'zod-dbs-core';

export const createClient = async (
  config: ZodDbsProviderConfig
): Promise<ZodDbsDatabaseClient> => {
  return {
    connect: async () => {
      await mssql.connect({
        server: config.host || 'localhost',
        port: config.port,
        user: config.user,
        password: config.password,
        database: config.database,
        options: { trustServerCertificate: true },
      });
    },
    query: async <T>(query: string) => {
      const result = await mssql.query<T>(query);
      return result.recordset as T;
    },
    end: async () => {
      await Promise.resolve();
    },
    config,
  };
};
