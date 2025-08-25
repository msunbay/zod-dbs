import type {
  ZodDbsConnectionConfig,
  ZodDbsDatabaseClient,
} from 'zod-dbs-core';

// Lazy import to avoid hard dependency at build time; users must install snowflake-sdk.
let sdk: any;

export async function createClient(
  options: ZodDbsConnectionConfig
): Promise<ZodDbsDatabaseClient> {
  if (!sdk) {
    try {
      sdk = await import('snowflake-sdk');
    } catch (e) {
      throw new Error('snowflake-sdk is required as a peer dependency');
    }
  }

  const connection = sdk.createConnection({
    account: (options as any).account,
    username: options.user,
    password: options.password,
    warehouse: (options as any).warehouse,
    database: options.database,
    schema: (options as any).schemaName,
    role: (options as any).role,
    // Snowflake uses TLS on 443 by default
  });

  const exec = <T>(sql: string, binds?: any[]): Promise<T> =>
    new Promise((resolve, reject) => {
      connection.execute({
        sqlText: sql,
        binds,
        complete: (err: any, _stmt: any, rows: T) => {
          if (err) return reject(err);
          resolve(rows);
        },
      });
    });

  return {
    connect: () =>
      new Promise<void>((resolve, reject) => {
        connection.connect((err: any) => (err ? reject(err) : resolve()));
      }),
    query: async <T>(query: string, params?: any[]) => exec<T>(query, params),
    end: () =>
      new Promise<void>((resolve) => {
        connection.destroy((/* err */) => resolve());
      }),
    config: {
      host: options.host,
      port: options.port,
      database: options.database,
      user: options.user,
      password: options.password,
      protocol: 'snowflake',
    },
  };
}
