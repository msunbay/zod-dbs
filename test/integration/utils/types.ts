import type { ZodDbsProviderConfig } from 'zod-dbs-core';

export interface TestDbContext {
  config: ZodDbsProviderConfig;
  teardown?(): Promise<void>;
}
