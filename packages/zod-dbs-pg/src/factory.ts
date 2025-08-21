import { ZodDbsDbConnector } from 'zod-dbs-core';

import { PostgreSqlConnector } from './PostgreSqlConnector.js';

export const createConnector = (): ZodDbsDbConnector => {
  return new PostgreSqlConnector();
};
