import { cosmiconfig } from 'cosmiconfig';
import { DEFAULT_CONFIGURATION } from 'zod-dbs';
import { ZodDbsConfig, ZodDbsConnectionConfig } from 'zod-dbs-core';

// Build an overrides object containing only values explicitly supplied via env vars.
function getEnvOverrides(): Partial<ZodDbsConnectionConfig> {
  const overrides: Partial<ZodDbsConnectionConfig> = {};
  if (process.env.ZOD_DBS_HOST) overrides.host = process.env.ZOD_DBS_HOST;
  if (process.env.ZOD_DBS_USER) overrides.user = process.env.ZOD_DBS_USER;
  if (process.env.ZOD_DBS_PASSWORD)
    overrides.password = process.env.ZOD_DBS_PASSWORD;
  if (process.env.ZOD_DBS_DB) overrides.database = process.env.ZOD_DBS_DB;
  if (process.env.ZOD_DBS_PORT)
    overrides.port = parseInt(process.env.ZOD_DBS_PORT);
  if (process.env.ZOD_DBS_SSL !== undefined)
    overrides.ssl = process.env.ZOD_DBS_SSL === 'true';
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
