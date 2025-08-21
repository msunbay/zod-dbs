import { logDebug } from 'zod-dbs-core';

import type {
  ZodDbsConfig,
  ZodDbsDbConnector,
  ZodDbsSchemaInfo,
} from 'zod-dbs-core';

import { DEFAULT_CONFIGURATION } from './constants.js';
import { generateConstantsFile } from './generate/generateConstantsFile.js';
import { generateIndexFiles } from './generate/generateIndexFiles.js';
import { generateSchemaFiles } from './generate/generateSchemaFile.js';
import { generateTypesFile } from './generate/generateTypesFile.js';
import { clearTablesDirectory } from './utils/index.js';

/**
 * Generates Zod schemas for all tables in the specified database schema.
 */
export const generateZodSchemas = async (
  dbConnector: ZodDbsDbConnector,
  config: ZodDbsConfig
): Promise<ZodDbsSchemaInfo> => {
  const generateConfig = {
    ...DEFAULT_CONFIGURATION,
    ...config,
  };

  const { connectionString, outputDir, schemaName, cleanOutput, onProgress } =
    generateConfig;

  if (cleanOutput) {
    clearTablesDirectory(outputDir);
  }

  logDebug(`Connecting to Postgres database at ${connectionString}`);

  const schema = await dbConnector.getSchemaInformation(config);

  onProgress?.('generating', { total: schema.tables.length });

  logDebug(
    `Generating zod schemas for ${schema.tables.length} tables in db schema '${schemaName}'`
  );

  for (const table of schema.tables) {
    await generateSchemaFiles(table, generateConfig);
  }

  await generateIndexFiles(schema, generateConfig);
  await generateConstantsFile(schema, generateConfig);
  await generateTypesFile(schema, generateConfig);

  onProgress?.('done');

  return schema;
};
