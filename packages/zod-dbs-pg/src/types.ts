import type { ConnectionOptions } from 'node:tls';

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
     * @default 5432
     */
    port?: number;
    /** Database user
     * @default 'postgres'
     */
    user?: string;
    /** Database password
     * @default 'postgres'
     */
    password?: string;
    /** Database name
     * @default 'postgres'
     */
    database?: string;
    /** Database schema to introspect
     * @default 'public'
     */
    schemaName?: string;
    /** Use SSL connection
     * @default false
     */
    ssl?: boolean | ConnectionOptions;
  }
}
