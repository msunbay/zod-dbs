import path from 'node:path';
import sdk from 'snowflake-sdk';
import { logDebug } from 'zod-dbs-core';

import type { ZodDbsDatabaseClient, ZodDbsProviderConfig } from 'zod-dbs-core';

export async function createClient(
  config: ZodDbsProviderConfig
): Promise<ZodDbsDatabaseClient> {
  if (!config.account)
    throw new Error("Snowflake 'account' is required in connection config");

  sdk.configure({
    additionalLogToConsole: false,
    logFilePath: path.join(process.cwd(), './.zod-dbs/snowflake.log'),
  });

  logDebug('Creating Snowflake client', config);

  const connection = sdk.createConnection({
    host: config.host,
    account: config.account,
    username: config.user,
    password: config.password,
    database: config.database,
    schema: config.schemaName,
    token: config.token,
    warehouse: config.warehouse,
    role: config.role,
    // Snowflake uses TLS on 443 by default
  });

  const exec = <T>(sql: string, binds?: any[]): Promise<T> =>
    new Promise((resolve, reject) => {
      connection.execute({
        sqlText: sql,
        binds,
        complete: (err: any, _stmt: any, rows: any) => {
          if (err) return reject(err);
          resolve(rows);
        },
      });
    });

  return {
    connect: async () => {
      await new Promise<void>((resolve, reject) => {
        connection.connect((err: any) => (err ? reject(err) : resolve()));
      });
    },
    query: async <T>(query: string, params?: any[]) => {
      return await exec<T>(query, params);
    },
    end: async () => {
      if (!connection.isUp()) return;

      await new Promise<void>((resolve) => {
        connection.destroy((/* err */) => resolve());
      });
    },
  };
}
