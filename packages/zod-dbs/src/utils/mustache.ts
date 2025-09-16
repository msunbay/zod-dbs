import fs from 'node:fs/promises';
import path from 'node:path';
import mustache from 'mustache';
import { toError } from 'zod-dbs-core';

// In-memory cache for template source and parsed tokens
const templateCache = new Map<string, string>();

/**
 * Load a mustache template from disk with caching and pre-parse it.
 * Pre-parsing (mustache.parse) can speed up repeated renders for the same template.
 */
export const loadMustacheTemplate = async (
  templateName: string
): Promise<string> => {
  if (templateCache.has(templateName)) {
    return templateCache.get(templateName)!;
  }

  const templatePath = path.join(
    import.meta.dirname,
    '../../templates',
    `${templateName}.mustache`
  );

  try {
    const content = await fs.readFile(templatePath, 'utf-8');

    // cache the raw template content
    templateCache.set(templateName, content);

    try {
      // let mustache pre-parse tokens for faster subsequent renders
      // parse returns tokens but also warms internal parse cache in mustache implementation
      mustache.parse(content);
    } catch {
      // parsing shouldn't block rendering; swallow parse errors but keep content cached
      // (errors here would be template syntax issues and will surface when rendering)
    }

    return content;
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

/** Utility: clear the in-memory template cache (useful in tests). */
export const clearTemplateCache = (): void => {
  templateCache.clear();
};

/** Utility: preload a list of templates into the cache. */
export const preloadTemplates = async (names: string[]): Promise<void> => {
  await Promise.all(names.map((n) => loadMustacheTemplate(n)));
};
