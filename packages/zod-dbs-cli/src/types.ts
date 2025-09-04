import { ZodDbsConfig, ZodDbsProvider, ZodDbsRenderer } from 'zod-dbs-core';

/**
 * Configuration options for the zod-dbs CLI.
 */
export interface ZodDbsCliConfig extends ZodDbsConfig {
  /**
   * The database provider to use.
   * This should match the suffix of the package name, e.g. 'pg' or the full name 'zod-dbs-pg'.
   * Optionally you can pass a custom provider instance.
   */
  provider: string | ZodDbsProvider;

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
