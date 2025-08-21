import { cosmiconfig } from 'cosmiconfig';
import { DEFAULT_CONFIGURATION } from 'zod-dbs';
import { ZodDbsConfig, ZodDbsConnectionConfig } from 'zod-dbs-core';

// Build an overrides object containing only values explicitly supplied via env vars.
function getEnvOverrides(): Partial<ZodDbsConnectionConfig> {
  const overrides: Partial<ZodDbsConnectionConfig> = {};
  if (process.env.POSTGRES_HOST) overrides.host = process.env.POSTGRES_HOST;
  if (process.env.POSTGRES_USER) overrides.user = process.env.POSTGRES_USER;
  if (process.env.POSTGRES_PASSWORD)
    overrides.password = process.env.POSTGRES_PASSWORD;
  if (process.env.POSTGRES_DB) overrides.database = process.env.POSTGRES_DB;
  if (process.env.POSTGRES_PORT) overrides.port = process.env.POSTGRES_PORT;
  if (process.env.POSTGRES_SSL !== undefined)
    overrides.ssl = process.env.POSTGRES_SSL === 'true';
  return overrides;
}

export const getConfiguration = async (
  overrides: Partial<ZodDbsConfig> = {}
): Promise<ZodDbsConfig> => {
  const explorer = cosmiconfig('zod-dbs');
  const result = await explorer.search();
  const envOverrides = getEnvOverrides();

  // Precedence (lowest -> highest): base defaults < config file < env overrides
  return {
    ...DEFAULT_CONFIGURATION,
    ...result?.config,
    ...envOverrides,
    ...overrides,
  };
};
