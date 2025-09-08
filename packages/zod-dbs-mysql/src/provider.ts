import type { ZodDbsProvider } from 'zod-dbs-core';

import { MySqlProvider } from './MySqlProvider.js';

export const createProvider = (): ZodDbsProvider => {
  return new MySqlProvider();
};
