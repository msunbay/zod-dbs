import { ZodDbsConfig } from 'zod-dbs-core';

// Base defaults independent of environment.
export const DEFAULT_CONFIGURATION: ZodDbsConfig = {
  host: 'localhost',
  user: 'postgres',
  password: 'postgres',
  database: 'postgres',
  port: 5432,
  ssl: false,
  schemaName: 'public',

  zodVersion: '3',
  outputDir: './zod-schemas',
  moduleResolution: 'commonjs',
  cleanOutput: false,

  fieldNameCasing: 'camelCase',
  objectNameCasing: 'PascalCase',

  caseTransform: true,
  singularize: true,
  coerceDates: true,
  defaultEmptyArray: false,
  defaultNullsToUndefined: true,
  defaultUnknown: false,
};
