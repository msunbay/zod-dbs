declare module 'zod-dbs-core' {
  interface ZodDbsProviderConfig {
    /**
     * The database file to connect to.
     * Use `:memory:` for an in-memory database.
     */
    database?: string;
  }
}

export {};
