import type { ZodDbsProvider } from 'zod-dbs-core';

import { DynamoDbProvider } from './DynamoDbProvider.js';

export const createProvider = (): ZodDbsProvider => new DynamoDbProvider();
