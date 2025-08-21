import { existsSync, readdirSync, unlinkSync } from 'fs';
import { mkdir } from 'fs/promises';
import path from 'path';
import { logDebug, ZodDbsTableType } from 'zod-dbs-core';

/**
 * Deletes all .ts files in the output schemas folder.
 */
export function clearTablesDirectory(outputPath: string) {
  // Check if the directory exists first
  if (!existsSync(outputPath)) {
    logDebug(`Directory ${outputPath} does not exist, nothing to clear`);
    return;
  }

  const files = readdirSync(outputPath, {
    recursive: true,
    withFileTypes: true,
  });

  for (const file of files) {
    if (file.isDirectory()) continue;
    if (!file.name.endsWith('.ts')) continue;

    const filePath = path.join(file.path, file.name);
    unlinkSync(filePath);
  }

  if (files.length > 0) {
    logDebug(`Deleted all .ts files in ${outputPath}`);
  }
}

export async function ensureFolder(folderPath: string) {
  const exists = existsSync(folderPath);

  if (!exists) {
    await mkdir(folderPath, { recursive: true });
  }
}

export const getOutputFolder = (type: ZodDbsTableType): string => {
  switch (type) {
    case 'table':
      return 'tables';
    case 'materialized_view':
      return 'materialized_views';
    case 'view':
      return 'views';
    case 'foreign_table':
      return 'foreign_tables';
    default:
      return 'others';
  }
};
