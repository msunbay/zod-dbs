declare module 'zod-dbs-core' {
  interface ZodDbsProviderConfig {
    /**
     * The database file to connect to (for SQLite).
     */
    database?: string;
    /**
     * The database schema to use (for SQLite, this is not commonly used).
     */
    schemaName?: string;
  }
}

export {};
