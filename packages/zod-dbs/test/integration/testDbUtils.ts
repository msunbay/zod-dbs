import fs from 'fs/promises';
import path from 'path';
import {
  ZodDbsBaseProvider,
  ZodDbsColumnInfo,
  ZodDbsProvider,
} from 'zod-dbs-core';

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

class TestProvider extends ZodDbsBaseProvider {
  constructor() {
    super({
      name: 'test',
      defaultConfiguration: {
        schemaName: 'test-schema',
      },
    });
  }

  protected fetchSchemaInfo(): Promise<ZodDbsColumnInfo[]> {
    return Promise.resolve(rawColumns as ZodDbsColumnInfo[]);
  }
}

export const createTestProvider = (): ZodDbsProvider => {
  return new TestProvider();
};
