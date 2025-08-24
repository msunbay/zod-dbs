import type { ZodDbsProvider } from 'zod-dbs-core';

import { SqliteProvider } from './SqliteProvider.js';

export const createProvider = (): ZodDbsProvider => new SqliteProvider();
