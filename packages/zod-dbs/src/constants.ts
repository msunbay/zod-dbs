import { ZodDbsConfig } from 'zod-dbs-core';

export const DEFAULT_OUTPUT_DIR = './zod-schemas';

// Base defaults independent of environment.
export const DEFAULT_CONFIGURATION: ZodDbsConfig = {
  host: 'localhost',

  zodVersion: '3',
  outputDir: DEFAULT_OUTPUT_DIR,
  moduleResolution: 'commonjs',
  cleanOutput: false,

  fieldNameCasing: 'camelCase',
  objectNameCasing: 'PascalCase',

  caseTransform: true,
  singularization: true,
  coerceDates: true,
  defaultEmptyArray: false,
  defaultNullsToUndefined: true,
  defaultUnknown: false,
};
