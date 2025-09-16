import fs from 'node:fs/promises';
import path from 'node:path';

import { generateZodSchemas } from '../../../src/generateZodSchemas.js';
import {
  createTestProvider,
  deleteOutputFiles,
  getOutputDir,
  getOutputFiles,
} from '../testDbUtils.js';

const provider = createTestProvider();

afterAll(async () => {
  await deleteOutputFiles(getOutputDir('moduleResolution'));
});

describe('module resolution formats', () => {
  it('generates modules without file extensions (commonjs module resolution)', async () => {
    const outputDir = getOutputDir('moduleResolution', 'commonjs');

    await generateZodSchemas({
      provider,
      config: {
        outputDir,
        moduleResolution: 'commonjs',
        include: ['users'],
      },
    });
    const outputFiles = await getOutputFiles(outputDir);

    for (const file of outputFiles) {
      const content = await fs.readFile(file, 'utf8');

      // Check that imports/exports don't include file extensions
      const importExportLines = content
        .split('\n')
        .filter((line) => line.includes('import') || line.includes('export'));

      for (const line of importExportLines) {
        if (line.includes("from './") || line.includes("from '../")) {
          expect(line).not.toMatch(/\.js['"]|\.ts['"]/);
        }
      }

      expect(content).toMatchSnapshot(path.relative(outputDir, file));
    }
  });

  it('generates modules with file extensions (esm module resolution)', async () => {
    const outputDir = getOutputDir('moduleResolution', 'esm');

    await generateZodSchemas({
      provider,
      config: {
        outputDir,
        moduleResolution: 'esm',
        include: ['users'],
      },
    });
    const outputFiles = await getOutputFiles(outputDir);

    for (const file of outputFiles) {
      const content = await fs.readFile(file, 'utf8');

      // Check that relative imports include file extensions
      const importExportLines = content
        .split('\n')
        .filter((line) => line.includes('import') || line.includes('export'));

      for (const line of importExportLines) {
        if (line.includes("from './") || line.includes("from '../")) {
          expect(line).toMatch(/\.js['"]/);
        }
      }

      expect(content).toMatchSnapshot(path.relative(outputDir, file));
    }
  });
});
