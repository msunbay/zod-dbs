import oracledb from 'oracledb';
import { logDebug, parseConnectionString } from 'zod-dbs-core';

import type { ZodDbsDatabaseClient, ZodDbsProviderConfig } from 'zod-dbs-core';

export async function createClient(
  config: ZodDbsProviderConfig
): Promise<ZodDbsDatabaseClient> {
  let pool: any | null = null;
  let conn: any | null = null;

  logDebug('Creating OracleDB client', config);

  const connectInternal = async () => {
    const { user, password, host, port, database } = config.connectionString
      ? parseConnectionString(config.connectionString)
      : config;

    if (!pool) {
      pool = await oracledb.createPool({
        user,
        password,
        connectString: `${host ?? 'localhost'}:${port ?? 1521}/${database}`,
      });
    }
    if (!conn) {
      conn = await pool.getConnection();
    }
  };

  const client: ZodDbsDatabaseClient = {
    connect: async () => {
      await connectInternal();
    },
    query: async <T>(query: string, params: any[] = []): Promise<T> => {
      if (!conn) await connectInternal();
      const res = await conn.execute(query, params, {
        outFormat: oracledb.OUT_FORMAT_OBJECT,
      });
      return (res.rows as T) ?? ([] as unknown as T);
    },
    end: async () => {
      if (conn) {
        await conn.close();
        conn = null;
      }
      if (pool) {
        await pool.close(0);
        pool = null;
      }
    },
  };

  return client;
}
