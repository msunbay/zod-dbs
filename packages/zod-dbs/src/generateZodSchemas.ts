import { logDebug } from 'zod-dbs-core';

import type {
  ZodDbsConfig,
  ZodDbsProvider,
  ZodDbsRenderer,
  ZodDbsSchemaInfo,
  ZodDbsZodVersion,
} from 'zod-dbs-core';

import { DEFAULT_CONFIGURATION } from './constants.js';
import { generateConstantsFile } from './generate/generateConstantsFile.js';
import { generateIndexFiles } from './generate/generateIndexFiles.js';
import { generateSchemaFiles } from './generate/generateSchemaFile.js';
import { generateTypesFile } from './generate/generateTypesFile.js';
import { Zod3Renderer } from './renderers/Zod3Renderer.js';
import { Zod4MiniRenderer } from './renderers/Zod4MiniRenderer.js';
import { Zod4Renderer } from './renderers/Zod4Renderer.js';
import { ZodBaseRenderer } from './renderers/ZodBaseRenderer.js';
import { clearTablesDirectory } from './utils/index.js';

export interface ZodDbsGenerateOptions {
  provider: ZodDbsProvider;
  renderer?: ZodDbsRenderer;
  config: ZodDbsConfig;
}

const createRenderer = (zodVersion: ZodDbsZodVersion | undefined) => {
  if (zodVersion === '3') {
    return new Zod3Renderer();
  }

  if (zodVersion === '4') {
    return new Zod4Renderer();
  }

  if (zodVersion === '4-mini') {
    return new Zod4MiniRenderer();
  }

  return new ZodBaseRenderer();
};

/**
 * Generates Zod schemas for all tables in the specified database schema.
 */
export const generateZodSchemas = async ({
  provider,
  renderer,
  config,
}: ZodDbsGenerateOptions): Promise<ZodDbsSchemaInfo> => {
  const generateConfig = {
    ...DEFAULT_CONFIGURATION,
    ...config,
  };

  const { outputDir, schemaName, cleanOutput, onProgress, zodVersion } =
    generateConfig;

  if (cleanOutput) {
    clearTablesDirectory(outputDir);
  }

  logDebug(`Connecting to database`);

  const schema = await provider.getSchemaInformation(config);

  onProgress?.('generating', { total: schema.tables.length });

  logDebug(
    `Generating zod schemas for ${schema.tables.length} tables in db schema '${schemaName}'`
  );

  const schemaRenderer = renderer ?? createRenderer(zodVersion);

  for (const table of schema.tables) {
    await generateSchemaFiles(table, schemaRenderer, generateConfig);
  }

  await generateIndexFiles(schema, generateConfig);
  await generateConstantsFile(schema, generateConfig);
  await generateTypesFile(schema, generateConfig);

  onProgress?.('done');

  return schema;
};
