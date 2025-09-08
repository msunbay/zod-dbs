import Database from 'better-sqlite3';
import { logDebug } from 'zod-dbs-core';

import type { ZodDbsDatabaseClient, ZodDbsProviderConfig } from 'zod-dbs-core';

export const createClient = async (
  config: ZodDbsProviderConfig
): Promise<ZodDbsDatabaseClient> => {
  logDebug('Creating SQLite client', config);

  const dbPath = config.database || ':memory:';
  const db = new Database(dbPath, { fileMustExist: false, readonly: false });

  const client: ZodDbsDatabaseClient = {
    connect: async () => {
      // better-sqlite3 opens on constructor; nothing to do
      return Promise.resolve();
    },
    query: async <T>(query: string, params: any[] = []) => {
      const stmt = db.prepare(query);
      const isSelect = /^\s*(select|pragma)\b/i.test(query);
      if (isSelect) {
        const rows = stmt.all(...params);
        return rows as unknown as T;
      } else {
        const info = stmt.run(...params);
        return info as unknown as T;
      }
    },
    end: async () => {
      db.close();
      return Promise.resolve();
    },
  };

  return client;
};
