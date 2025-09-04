declare module 'zod-dbs-core' {
  interface ZodDbsProviderConfig {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    database?: string;
    schemaName?: string;
    ssl?: boolean | object;
  }
}

export {};
