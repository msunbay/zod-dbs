declare module 'zod-dbs-core' {
  interface ZodDbsProviderConfig {
    /**
     * Full database connection string (overrides other connection options)
     */
    connectionString?: string;
    /**
     * Database host
     * @default 'localhost'
     */
    host?: string;
    /**
     * Database server port
     * @default 1521
     */
    port?: number;
    /**
     * Database user
     */
    user?: string;
    /**
     * Database password
     */
    password?: string;
    /**
     * Database name
     */
    database?: string;
    /**
     * Database schema to introspect.
     * Defaults to user if not provided.
     */
    schemaName?: string;
  }
}

export {};
