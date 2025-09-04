import fs from 'fs/promises';
import path from 'path';

export const getCliPath = (): string => {
  return path.resolve(import.meta.dirname, '../../index.js');
};

export const getProviderOutputDir = (
  provider: string,
  testSuite: string,
  subPath = ''
): string =>
  path.resolve(import.meta.dirname, `./output/`, provider, testSuite, subPath);

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
