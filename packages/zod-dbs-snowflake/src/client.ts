import path from 'path';
import sdk from 'snowflake-sdk';
import { logDebug } from 'zod-dbs-core';

import type {
  ZodDbsConnectionConfig,
  ZodDbsDatabaseClient,
} from 'zod-dbs-core';

export async function createClient(
  options: ZodDbsConnectionConfig
): Promise<ZodDbsDatabaseClient> {
  if (!options.account)
    throw new Error("Snowflake 'account' is required in connection config");

  sdk.configure({
    additionalLogToConsole: false,
    logFilePath: path.join(process.cwd(), '/snowflake.log'),
  });

  logDebug('Creating Snowflake connection', { options });

  const connection = sdk.createConnection({
    host: options.host,
    account: options.account,
    username: options.user,
    password: options.password,
    database: options.database,
    schema: options.schemaName,
    token: options.token,
    warehouse: options.warehouse,
    role: options.role,
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
    config: {
      ...options,
      protocol: 'snowflake',
    },
  };
}
