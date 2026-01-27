import { existsSync, readdirSync, unlinkSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { logDebug } from 'zod-dbs-core';

import type { ZodDbsTableType } from 'zod-dbs-core';

/**
 * Deletes all .ts files in the output schemas folder.
 */
export function clearTablesDirectory(outputPath: string) {
  // Check if the directory exists first
  if (!existsSync(outputPath)) {
    logDebug(`Directory ${outputPath} does not exist, nothing to clear`);
    return;
  }

  let deleted = 0;

  function walk(dir: string) {
    const entries = readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }

      if (!entry.name.endsWith('.ts')) continue;

      try {
        unlinkSync(fullPath);
        deleted += 1;
      } catch (err) {
        logDebug(`Failed to delete file ${fullPath}: ${String(err)}`);
      }
    }
  }

  walk(outputPath);

  if (deleted > 0) {
    logDebug(`Deleted ${deleted} .ts file(s) in ${outputPath}`);
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
