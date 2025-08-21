import { ZodDbsDbConnector } from 'zod-dbs-core';

import { MySqlConnector } from './MySqlConnector.js';

export const createConnector = (): ZodDbsDbConnector => {
  return new MySqlConnector();
};
