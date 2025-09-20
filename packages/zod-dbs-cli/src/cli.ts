import { generateZodSchemas } from 'zod-dbs';
import { logDebug, toError } from 'zod-dbs-core';

import type { ZodDbsCliConfig, ZodDbsCliOptions } from './types.js';

import { detectDebugMode, getConfiguration } from './config.js';
import { runCommander } from './program.js';
import { loadProvider } from './provider.js';
import { isSilentMode } from './utils/args.js';
import { logAppName, logEmpty, logError, logSetting } from './utils/logger.js';
import { createProgressHandler } from './utils/progress.js';
import { getAppVersion } from './utils/version.js';

export const runCli = async (cliOptions: ZodDbsCliOptions = {}) => {
  detectDebugMode();
  logDebug('Starting zod-dbs CLI with options:', cliOptions);

  const appVersion = cliOptions.appVersion ?? (await getAppVersion());
  const appName = cliOptions.appName || 'zod-dbs';
  const silent = isSilentMode();

  if (!silent) {
    logAppName(`${appName} CLI`);
  }

  const config = await getConfiguration(cliOptions);
  const provider = await loadProvider(cliOptions.overrides?.provider, config);

  const options = runCommander({
    provider,
    appName,
    appVersion,
    includeProviderOption: !cliOptions.overrides?.provider,
  });

  const spinner = createProgressHandler(silent);

  try {
    const cliConfig: ZodDbsCliConfig = {
      ...config,
      ...options,
    };

    logDebug('Final configuration:', cliConfig);

    if (!cliConfig.silent) {
      logSettings(cliConfig);
      logEmpty();
    }

    await generateZodSchemas({
      provider,
      renderer: cliConfig.renderer,
      config: {
        ...cliConfig,
        onProgress: spinner.onProgress,
      },
    });

    spinner.done();
  } catch (error) {
    spinner.fail();

    logError(toError(error).message);
    logDebug(error);

    process.exit(1);
  }
};

const logSettings = (config: ZodDbsCliConfig) => {
  for (const [key, value] of Object.entries(config)) {
    if (value !== undefined && value !== null) {
      logSetting(key, value);
    }
  }
};
