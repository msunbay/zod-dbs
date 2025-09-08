import path from 'node:path';
import { createConnectionString } from 'zod-dbs-core';

import { getProviderConfig } from '../utils/context.js';

export const getOutputDir = (testSuite: string, subPath = ''): string =>
  path.resolve(import.meta.dirname, `./output/`, testSuite, subPath);

export const getConnectionString = (): string => {
  const config = getProviderConfig();

  return createConnectionString(config);
};
