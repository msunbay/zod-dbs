import { promises } from 'fs';
import path from 'path';
import mustache from 'mustache';
import { toError } from 'zod-dbs-core';

export const loadMustacheTemplate = async (
  templateName: string
): Promise<string> => {
  const templatePath = path.join(
    import.meta.dirname,
    '../../templates',
    `${templateName}.mustache`
  );

  try {
    return await promises.readFile(templatePath, 'utf-8');
  } catch (error) {
    throw new Error(
      `Failed to load template: ${templatePath}. ${toError(error).message}`
    );
  }
};

export const renderMustacheTemplate = async (
  templateName: string,
  data: object,
  partials: Record<string, string> = {}
): Promise<string> => {
  const templateContent = await loadMustacheTemplate(templateName);
  return mustache.render(templateContent, data, partials);
};
