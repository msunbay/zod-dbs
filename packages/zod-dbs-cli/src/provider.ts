import { logDebug } from 'zod-dbs-core';

import type { ZodDbsProvider } from 'zod-dbs-core';

export const importProvider = async (
  provider: string | ZodDbsProvider
): Promise<ZodDbsProvider> => {
  if (!provider) throw new Error('Provider must be specified');

  if (typeof provider !== 'string') {
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
