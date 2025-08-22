import { logDebug } from 'zod-dbs-core';

import type { ZodDbsProvider } from 'zod-dbs-core';
import type { ZodDbsProviderName } from './types.js';

export const loadProvider = async (
  provider: ZodDbsProviderName | ZodDbsProvider
) => {
  if (typeof provider !== 'string') {
    return provider;
  }

  const name = `zod-dbs-${provider}`;

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
    throw new Error(
      `Failed to import connector for provider ${provider}: ${error}`
    );
  }

  throw new Error(`Unsupported database provider: ${provider}`);
};
