import oracledb from 'oracledb';

import type { ZodDbsDatabaseClient, ZodDbsProviderConfig } from 'zod-dbs-core';

export async function createClient(
  config: ZodDbsProviderConfig
): Promise<ZodDbsDatabaseClient> {
  let pool: any | null = null;
  let conn: any | null = null;

  const connectInternal = async () => {
    if (!pool) {
      pool = await oracledb.createPool({
        user: config.user,
        password: config.password,
        connectString: `${config.host ?? 'localhost'}:${config.port ?? 1521}/${config.database}`,
      });
    }
    if (!conn) {
      conn = await pool.getConnection();
    }
  };

  const client: ZodDbsDatabaseClient = {
    config,
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
