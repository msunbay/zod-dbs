import { ZodDbsProvider } from 'zod-dbs-core';

import { OracleProvider } from './OracleProvider.js';

export const createProvider = (): ZodDbsProvider => {
  return new OracleProvider();
};
