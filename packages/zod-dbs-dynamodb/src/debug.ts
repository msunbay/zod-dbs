import fs from 'node:fs/promises';
import path from 'node:path';
import { logDebug } from 'zod-dbs-core';

export const logEntriesToFile = async (tableName: string, entries: any[]) => {
  if (entries.length === 0) return;

  const outputDir = path.join(process.cwd(), './.zod-dbs/dynamodb');
  const filePath = path.join(outputDir, `${tableName}.json`);

  await fs.mkdir(outputDir, { recursive: true });

  const data = {
    scannedEntries: {
      count: entries.length,
      entries,
    },
  };

  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  logDebug(`Wrote ${entries.length} entries to ${filePath}`);
};
