import mssql from 'mssql';
import { ZodDbsConnectionConfig, ZodDbsDatabaseClient } from 'zod-dbs-core';

export const createClient = async (
  options: ZodDbsConnectionConfig
): Promise<ZodDbsDatabaseClient> => {
  return {
    connect: async () => {
      await mssql.connect({
        server: options.host || 'localhost',
        port: options.port,
        user: options.user,
        password: options.password,
        database: options.database,
        options: { trustServerCertificate: true },
      });
    },
    query: async <T>(query: string) => {
      const result = await mssql.query<T>(query);
      return result.recordset as T;
    },
    end: async () => {},
    config: {
      ...options,
      protocol: 'mssql',
    },
  };
};
