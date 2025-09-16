import type { ZodDbsProvider } from 'zod-dbs-core';

import { MsSqlServerProvider } from './MsSqlServerProvider.js';

export const createProvider = (): ZodDbsProvider => {
  return new MsSqlServerProvider();
};
