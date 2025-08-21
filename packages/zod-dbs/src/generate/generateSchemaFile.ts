import { promises } from 'fs';
import { logDebug } from 'zod-dbs-core';

import type { ZodDbsConfig, ZodDbsTableInfo } from 'zod-dbs-core';

import { ensureFolder, getOutputFolder } from '../utils/index.js';
import { renderMustacheTemplate } from '../utils/mustache.js';
import { DefaultRenderer } from './renderers/DefaultRenderer.js';
import { Zod3Renderer } from './renderers/Zod3Renderer.js';
import { Zod4MiniRenderer } from './renderers/Zod4MiniRenderer.js';
import { Zod4Renderer } from './renderers/Zod4Renderer.js';

const createRenderer = (config: ZodDbsConfig) => {
  if (config.renderer) {
    return config.renderer;
  }

  if (config.zodVersion === '3') {
    return new Zod3Renderer();
  }

  if (config.zodVersion === '4') {
    return new Zod4Renderer();
  }

  if (config.zodVersion === '4-mini') {
    return new Zod4MiniRenderer();
  }

  return new DefaultRenderer();
};

async function generateSchemaFile(
  table: ZodDbsTableInfo,
  config: ZodDbsConfig
): Promise<void> {
  logDebug(`Generating schema for: ${table.type} ${table.name}`);

  if (table.columns.length === 0) {
    logDebug(`No columns found for ${table.type} ${table.name}`);
    return;
  }

  const renderer = createRenderer(config);
  const output = await renderer.renderSchema(table, config);

  const folderPath = `${config.outputDir}/${getOutputFolder(table.type)}/${table.name}`;
  await ensureFolder(folderPath);

  const fileName = `${folderPath}/schema.ts`;
  await promises.writeFile(fileName, output, 'utf8');

  logDebug(`Generated "${fileName}"`);
}

async function generateSchemaIndexFile(
  table: ZodDbsTableInfo,
  config: ZodDbsConfig
): Promise<void> {
  logDebug(`Generating schema index file for: ${table.type} ${table.name}`);

  if (table.columns.length === 0) {
    logDebug(`No columns found for ${table.type} ${table.name}`);
    return;
  }

  const output = await renderMustacheTemplate('schema-index', {
    ...table,
    fileName: config.moduleResolution === 'esm' ? `schema.js` : 'schema',
  });

  const folderPath = `${config.outputDir}/${getOutputFolder(table.type)}/${table.name}`;
  await ensureFolder(folderPath);

  const fileName = `${folderPath}/index.ts`;
  await promises.writeFile(fileName, output, 'utf8');

  logDebug(`Generated "${fileName}"`);
}

export async function generateSchemaFiles(
  table: ZodDbsTableInfo,
  config: ZodDbsConfig
): Promise<void> {
  await generateSchemaFile(table, config);
  await generateSchemaIndexFile(table, config);
}
