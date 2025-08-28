import { ZodDbsConfig, ZodDbsProvider, ZodDbsRenderer } from 'zod-dbs-core';

export type ZodDbsProviderName =
  | 'pg'
  | 'mysql'
  | 'mmsql'
  | 'oracle'
  | 'mongodb'
  | 'snowflake'
  | `zod-dbs-${string}`;

/**
 * Configuration options for the zod-dbs CLI.
 */
export interface ZodDbsCliConfig extends ZodDbsConfig {
  /**
   * The database provider to use.
   * This should match the name of the package, e.g. 'pg' for 'zod-dbs-pg'.
   * Optionally you can pass a custom provider instance.
   */
  provider: ZodDbsProviderName | ZodDbsProvider;

  /**
   * Optional custom renderer to use for generating schemas.
   * If not provided, the default renderer based on the Zod version will be used.
   */
  renderer?: ZodDbsRenderer;
}

export interface ZodDbsCliOptions {
  overrides?: Partial<ZodDbsCliConfig>;
  appName?: string;
  appVersion?: string;
}
