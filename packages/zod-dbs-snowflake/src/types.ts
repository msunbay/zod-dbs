declare module "zod-dbs-core" {
  interface ZodDbsProviderConfig {
    /**
     * Snowflake account URL host (e.g., xy12345.snowflakecomputing.com)
     */
    host?: string;
    /**
     * Username for authentication
     */
    username?: string;
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
     * Private key for key pair authentication
     */
    privateKey?: string;
    /**
     * Passphrase for the private key, if applicable
     */
    privateKeyPass?: string;
    /**
     * Authenticator to use (e.g., "externalbrowser", "oauth", etc.)
     */
    authenticator?: string;
    /**
     * Application name for logging and tracking
     */
    application?: string;
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
