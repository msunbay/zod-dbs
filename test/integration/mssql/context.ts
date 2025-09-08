import path from 'node:path';

import { getProviderConfig } from '../utils/context.js';

export const getOutputDir = (testSuite: string, subPath = ''): string =>
  path.resolve(import.meta.dirname, `./output/`, testSuite, subPath);

export const getConnectionString = (): string => {
  const config = getProviderConfig();

  return `Server=${config.host || 'localhost'},${config.port};Database=${config.database};User Id=${config.user};Password=${config.password};TrustServerCertificate=true;`;
};
