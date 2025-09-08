import { promises } from 'node:fs';
import { logDebug } from 'zod-dbs-core';

import type { ZodDbsConfig, ZodDbsSchemaInfo } from 'zod-dbs-core';

import { ensureFolder } from '../utils/fs.js';
import { renderMustacheTemplate } from '../utils/mustache.js';

export const generateTypesFile = async (
  schema: ZodDbsSchemaInfo,
  { outputDir }: Pick<ZodDbsConfig, 'outputDir'>
) => {
  const tables = schema.tables.filter((table) => table.type === 'table');
  const views = schema.tables.filter((table) => table.type === 'view');
  const materializedViews = schema.tables.filter(
    (table) => table.type === 'materialized_view'
  );
  const foreignTables = schema.tables.filter(
    (table) => table.type === 'foreign_table'
  );

  const hasTables = tables.length > 0;
  const hasViews = views.length > 0;
  const hasMaterializedViews = materializedViews.length > 0;
  const hasForeignTables = foreignTables.length > 0;

  if (!hasTables && !hasViews && !hasMaterializedViews && !hasForeignTables) {
    logDebug('No tables or views found, skipping types file generation');
    return;
  }

  if (!outputDir) {
    throw new Error('Output directory is not defined in config');
  }

  const content = await renderMustacheTemplate('types', {
    tables,
    views,
    materializedViews,
    foreignTables,
    hasTables: tables.length > 0,
    hasViews: views.length > 0,
    hasMaterializedViews: materializedViews.length > 0,
    hasForeignTables: foreignTables.length > 0,
  });

  const filePath = `${outputDir}/types.ts`;

  await ensureFolder(outputDir);

  await promises.writeFile(filePath, content, 'utf8');

  logDebug(`Generated "${filePath}" file`);
};
