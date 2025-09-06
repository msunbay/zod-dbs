declare module 'zod-dbs-core' {
  interface ZodDbsProviderConfig {
    connectionString?: string;
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    schemaName?: string;
  }
}

export {};
