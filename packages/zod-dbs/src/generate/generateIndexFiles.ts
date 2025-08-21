import { promises } from 'fs';
import { logDebug } from 'zod-dbs-core';

import type {
  ZodDbsConfig,
  ZodDbsSchemaInfo,
  ZodDbsTableType,
} from 'zod-dbs-core';

import { getOutputFolder } from '../utils/fs.js';
import { renderMustacheTemplate } from '../utils/mustache.js';

const generateSchemasIndexFile = async (
  schema: ZodDbsSchemaInfo,
  type: ZodDbsTableType,
  {
    outputDir,
    moduleResolution,
  }: Pick<ZodDbsConfig, 'outputDir' | 'moduleResolution'>
) => {
  const exports = schema.tables
    .filter((table) => table.type === type)
    .map((table) => ({
      ...table,
      fileName:
        moduleResolution === 'esm' ? `${table.name}/index.js` : table.name,
    }));

  if (exports.length === 0) {
    logDebug(`No ${type} found in schema to generate index file.`);

    return;
  }

  const content = await renderMustacheTemplate('index', { exports });

  const filePath = `${outputDir}/${getOutputFolder(type)}/index.ts`;

  await promises.writeFile(filePath, content, 'utf8');

  logDebug(`Generated "${filePath}" file`);
};

export const generateIndexFiles = async (
  schema: ZodDbsSchemaInfo,
  config: ZodDbsConfig
): Promise<void> => {
  await generateSchemasIndexFile(schema, 'table', config);
  await generateSchemasIndexFile(schema, 'view', config);
  await generateSchemasIndexFile(schema, 'materialized_view', config);
  await generateSchemasIndexFile(schema, 'foreign_table', config);
  await generateSchemasIndexFile(schema, 'unknown', config);
};
