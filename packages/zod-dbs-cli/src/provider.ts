import { logDebug, toError } from 'zod-dbs-core';

import type { ZodDbsProvider } from 'zod-dbs-core';
import type { ZodDbsCliConfig } from './types.js';

import { getArgumentValue } from './utils/args.js';
import { logError } from './utils/logger.js';

const importProvider = async (
  provider: string | ZodDbsProvider
): Promise<ZodDbsProvider> => {
  if (!provider)
    throw new Error(
      'Provider must be specified through the --provider flag or in a config file'
    );

  if (typeof provider !== 'string') {
    logDebug('Using provided provider instance:', provider);
    return provider;
  }

  const name = provider.startsWith('zod-dbs-')
    ? provider
    : `zod-dbs-${provider}`;

  try {
    let importedProvider = await import(name);

    logDebug(`Using provider: ${provider}`, importedProvider);

    if (importedProvider.default) {
      importedProvider = importedProvider.default;
    }

    if (importedProvider.createProvider) {
      return importedProvider.createProvider();
    }
  } catch (error) {
    throw new Error(`Failed to import provider ${provider}: ${error}`);
  }

  throw new Error(`Unsupported database provider: ${provider}`);
};

export const loadProvider = async (
  override: ZodDbsProvider | string | undefined,
  config: ZodDbsCliConfig
) => {
  try {
    const providerOrName =
      override ??
      getArgumentValue('-p') ??
      getArgumentValue('--provider') ??
      config.provider;

    return await importProvider(providerOrName);
  } catch (error) {
    logError(toError(error).message);
    logDebug(error);
    process.exit(1);
  }
};
