import fs from 'fs/promises';
import path from 'path';
import {
  DatabaseConnector,
  ZodDbsConnectionConfig,
  ZodDbsConnectorConfig,
  ZodDbsRawColumnInfo,
} from 'zod-dbs-core';
import { DatabaseClient } from 'zod-dbs-core/dist/database/DatabaseConnector.js';

import rawColumns from './fixtures/raw-columns.json' with { type: 'json' };

export const getOutputDir = (testSuite: string, subPath = ''): string =>
  path.resolve(import.meta.dirname, `./output/`, testSuite, subPath);

export async function getOutputFiles(dir: string): Promise<string[]> {
  let results: string[] = [];
  const list = await fs.readdir(dir, { withFileTypes: true });

  for (const file of list) {
    const filePath = path.join(dir, file.name);

    if (file.isDirectory()) {
      results = results.concat(await getOutputFiles(filePath));
    } else {
      results.push(filePath);
    }
  }

  return results;
}

export async function deleteOutputFiles(dir: string): Promise<void> {
  await fs.rm(dir, { recursive: true });
}

class TestDbConnector extends DatabaseConnector {
  protected createClient(options: ZodDbsConnectionConfig): DatabaseClient {
    throw new Error('Method not implemented.');
  }

  protected fetchSchemaInfo(
    config: ZodDbsConnectorConfig
  ): Promise<ZodDbsRawColumnInfo[]> {
    return Promise.resolve(rawColumns as ZodDbsRawColumnInfo[]);
  }
}

export const createTestConnector = (): DatabaseConnector => {
  return new TestDbConnector();
};
