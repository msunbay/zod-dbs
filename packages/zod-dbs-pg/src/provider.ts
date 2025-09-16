import type { ZodDbsProvider } from 'zod-dbs-core';

import { PostgreSqlProvider } from './PostgreSqlProvider.js';

export const createProvider = (): ZodDbsProvider => {
  return new PostgreSqlProvider();
};
