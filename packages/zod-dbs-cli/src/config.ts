import { cosmiconfig } from 'cosmiconfig';
import { convertCaseFormat, ZodDbsConfig } from 'zod-dbs';
import { enableDebug, logDebug, toError } from 'zod-dbs-core';

import { ZodDbsCliConfig, ZodDbsCliOptions } from './types.js';
import { getArgumentValue, hasArgument } from './utils/args.js';

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

const loadConfigFile = async (name: string, suffix?: string) => {
  const configName = suffix ? `${name}-${suffix}` : name;

  logDebug(`Searching for configuration: ${configName}`);

  try {
    const explorer = cosmiconfig(configName);

    const result = await explorer.search();

    logDebug(`Loaded configuration from file ${configName}:`, result?.config);

    if (!result?.config && suffix) {
      throw new Error('No configuration found');
    }

    return result?.config;
  } catch (error) {
    logDebug(`Failed to load configuration from file ${configName}:`, error);

    throw new Error(
      `Failed to load configuration from file "${configName}": ${toError(error).message}`
    );
  }
};

export const getConfiguration = async ({
  appName = 'zod-dbs',
  overrides,
}: ZodDbsCliOptions = {}): Promise<ZodDbsCliConfig> => {
  const configSuffix = getArgumentValue('--config-name');

  if (configSuffix?.includes('.'))
    throw new Error(
      'Invalid config name: should not include file extension or period.'
    );

  const config = await loadConfigFile(appName, configSuffix);
  const envOverrides = getEnvOverrides(appName);

  // Precedence (lowest -> highest): base defaults < config file < env overrides
  return {
    ...config,
    ...envOverrides,
    ...overrides,
  };
};
