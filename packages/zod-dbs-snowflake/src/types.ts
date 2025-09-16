declare module 'zod-dbs-core' {
  interface ZodDbsProviderConfig {
    /**
     * Snowflake account URL host (e.g., xy12345.snowflakecomputing.com)
     */
    host?: string;
    /**
     * Username for authentication
     */
    user?: string;
    /**
     * Password for authentication
     */
    password?: string;
    /**
     * Database name to connect to
     */
    database?: string;
    /**
     * Schema name to introspect
     */
    schemaName?: string;
    /**
     * Snowflake account identifier (e.g., xy12345.eu-central-1)
     */
    account?: string;
    /**
     * JWT token for auth
     */
    token?: string;
    /**
     * Role to assume
     */
    role?: string;
    /**
     * Virtual warehouse to use
     */
    warehouse?: string;
  }
}

export {};
