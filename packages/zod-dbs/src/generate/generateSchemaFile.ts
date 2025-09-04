import { promises } from 'fs';
import { logDebug } from 'zod-dbs-core';

import type { ZodDbsConfig, ZodDbsRenderer, ZodDbsTable } from 'zod-dbs-core';

import { ensureFolder, getOutputFolder } from '../utils/index.js';
import { renderMustacheTemplate } from '../utils/mustache.js';

async function generateSchemaFile(
  table: ZodDbsTable,
  renderer: ZodDbsRenderer,
  config: ZodDbsConfig
): Promise<void> {
  logDebug(`Generating schema for: ${table.type} ${table.name}`);

  if (table.columns.length === 0) {
    logDebug(`No columns found for ${table.type} ${table.name}`);
    return;
  }

  const files = await renderer.renderSchemaFiles(table, config);

  for (const file of files) {
    const folderPath = `${config.outputDir}/${getOutputFolder(table.type)}/${table.name}`;
    await ensureFolder(folderPath);

    const fileName = `${folderPath}/${file.name}.ts`;
    await promises.writeFile(fileName, file.content, 'utf8');

    logDebug(`Generated "${fileName}"`);
  }
}

async function generateSchemaIndexFile(
  table: ZodDbsTable,
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
  table: ZodDbsTable,
  renderer: ZodDbsRenderer,
  config: ZodDbsConfig
): Promise<void> {
  await generateSchemaFile(table, renderer, config);
  await generateSchemaIndexFile(table, config);
}
