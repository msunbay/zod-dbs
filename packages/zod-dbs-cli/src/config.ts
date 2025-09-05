import { cosmiconfig } from 'cosmiconfig';
import {
  convertCaseFormat,
  DEFAULT_CONFIGURATION,
  ZodDbsConfig,
} from 'zod-dbs';
import { enableDebug, logDebug } from 'zod-dbs-core';

import { ZodDbsCliConfig, ZodDbsCliOptions } from './types.js';
import { hasArgument } from './utils/args.js';

const getEnvVarName = (prefix: string, name: string) => `${prefix}_${name}`;

const getEnvVar = (prefix: string, name: string) => {
  const varName = getEnvVarName(prefix, name);
  const value = process.env[varName];

  logDebug(`Reading env var ${varName}: ${value ?? '<not set>'}`);

  return value;
};

/**
 * Enables debug mode if the ZOD_DBS_DEBUG env var is set to 'true' or '1',
 * or if the --debug CLI argument is present.
 */
export const enableDebugMode = () => {
  const debug = getEnvVar('ZOD_DBS', 'DEBUG');
  const enabled = debug === 'true' || debug === '1' || hasArgument('--debug');

  if (enabled) {
    enableDebug();
    logDebug('Debug mode enabled');
  }
};

// Build an overrides object containing only values explicitly supplied via env vars.
function getEnvOverrides(appName: string): Partial<ZodDbsConfig> {
  // Normalize appName to ENV prefix: replace non-alphanumerics with underscores and uppercase.
  // Example: 'zod-dbs' -> 'ZOD_DBS'
  const envVarPrefix = convertCaseFormat(appName, 'snake_case').toUpperCase();
  const overrides: Record<string, string | number | boolean> = {};

  const host = getEnvVar(envVarPrefix, 'HOST');
  const user = getEnvVar(envVarPrefix, 'USER');
  const password = getEnvVar(envVarPrefix, 'PASSWORD');
  const database =
    getEnvVar(envVarPrefix, 'DB') || getEnvVar(envVarPrefix, 'DATABASE');
  const port = getEnvVar(envVarPrefix, 'PORT');
  const ssl = getEnvVar(envVarPrefix, 'SSL');

  if (host) overrides.host = host;
  if (user) overrides.user = user;
  if (password) overrides.password = password;
  if (database) overrides.database = database;
  if (port) overrides.port = parseInt(port);
  if (ssl !== undefined) overrides.ssl = ssl === 'true';

  logDebug('Environment variable overrides:', overrides);

  return overrides;
}

export const getConfiguration = async ({
  appName = 'zod-dbs',
  overrides,
}: ZodDbsCliOptions = {}): Promise<ZodDbsCliConfig> => {
  const explorer = cosmiconfig(appName);
  const result = await explorer.search();
  const envOverrides = getEnvOverrides(appName);

  // Precedence (lowest -> highest): base defaults < config file < env overrides
  return {
    ...DEFAULT_CONFIGURATION,
    ...result?.config,
    ...envOverrides,
    ...overrides,
  };
};
