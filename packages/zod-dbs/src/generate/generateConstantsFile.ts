import { promises } from 'fs';
import { logDebug } from 'zod-dbs-core';

import type { ZodDbsConfig, ZodDbsSchemaInfo } from 'zod-dbs-core';

import { getSchemaPrefix } from '../renderers/format.js';
import { renderMustacheTemplate } from '../utils/mustache.js';

export const generateConstantsFile = async (
  schema: ZodDbsSchemaInfo,
  { outputDir }: Pick<ZodDbsConfig, 'outputDir'>
) => {
  const constants = schema.tables.map((info) => {
    const prefix = getSchemaPrefix(info).toUpperCase();
    const upperName = info.name.toUpperCase();
    const constantName = prefix ? `${prefix}_${upperName}` : upperName;

    return { name: constantName, value: info.name };
  });

  const filePath = `${outputDir}/constants.ts`;

  const content = await renderMustacheTemplate('constants', { constants });

  await promises.writeFile(filePath, content, 'utf8');

  logDebug(`Generated "${filePath}" file`);
};
