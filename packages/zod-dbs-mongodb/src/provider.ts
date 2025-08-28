import type { ZodDbsProvider } from 'zod-dbs-core';

import { MongoDbProvider } from './MongoDbProvider.js';

export const createProvider = (): ZodDbsProvider => new MongoDbProvider();
