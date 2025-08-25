declare module 'zod-dbs-core' {
  interface ZodDbsConnectionConfig {
    /** Snowflake account identifier (e.g., xy12345.eu-central-1) */
    account?: string;
    /** JWT token for auth */
    token?: string;
    /** Role to assume */
    role?: string;
    /** Virtual warehouse to use */
    warehouse?: string;
  }
}

export {};
