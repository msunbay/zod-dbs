import { ZodDbsProvider } from './types.js';

export const getDbConnector = async (provider: ZodDbsProvider) => {
  const name = `zod-dbs-${provider}`;

  try {
    const connector = await import(name);

    if (connector.createConnector()) {
      return connector.createConnector();
    }
  } catch (error) {
    throw new Error(
      `Failed to import connector for provider ${provider}: ${error}`
    );
  }

  throw new Error(`Unsupported database connector: ${provider}`);
};
