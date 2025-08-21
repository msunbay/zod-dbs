import { Client } from 'pg';
import { createConnectionString, ZodDbsConnectionConfig } from 'zod-dbs-core';

export const createClient = (options: ZodDbsConnectionConfig) => {
  return new Client({
    connectionString: createConnectionString(options),
    ssl: options.ssl,
    application_name: 'zod-dbs-pg',
  });
};
