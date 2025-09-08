import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

import { generateZodSchemas } from '../../../src/generateZodSchemas.js';
import {
  createTestProvider,
  getOutputDir,
  getOutputFiles,
} from '../testDbUtils.js';

const provider = createTestProvider();

describe('clean output option', () => {
  it('cleans output directory when cleanOutput is true', async () => {
    const outputDir = getOutputDir('cleanOutput', 'clean-enabled');

    // Create the output directory with some existing files
    await fs.mkdir(`${outputDir}/tables`, { recursive: true });
    await fs.writeFile(`${outputDir}/tables/old-file.ts`, '// old content');
    await fs.writeFile(`${outputDir}/old-root-file.ts`, '// old root content');

    // Verify files exist before generation
    expect(existsSync(`${outputDir}/tables/old-file.ts`)).toBe(true);
    expect(existsSync(`${outputDir}/old-root-file.ts`)).toBe(true);

    await generateZodSchemas({
      provider,
      config: {
        outputDir: outputDir,
        cleanOutput: true,
        moduleResolution: 'esm',
        include: ['users'],
      },
    });

    // Old files in tables directory should be cleaned
    expect(existsSync(`${outputDir}/tables/old-file.ts`)).toBe(false);

    // cleanOutput should clean the entire output directory
    expect(existsSync(`${outputDir}/tables/old-table-file.ts`)).toBe(false);
    expect(existsSync(`${outputDir}/old-root-file.ts`)).toBe(false);

    const outputFiles = await getOutputFiles(outputDir);

    for (const file of outputFiles) {
      const content = await fs.readFile(file, 'utf8');
      expect(content).toMatchSnapshot(path.relative(outputDir, file));
    }
  });

  it('preserves existing files when cleanOutput is false', async () => {
    const outputDir = getOutputDir('cleanOutput', 'clean-disabled');

    // Create the output directory with some existing files
    await fs.mkdir(`${outputDir}/tables`, { recursive: true });
    await fs.writeFile(`${outputDir}/tables/old-file.ts`, '// old content');

    // Verify file exists before generation
    expect(existsSync(`${outputDir}/tables/old-file.ts`)).toBe(true);

    await generateZodSchemas({
      provider,
      config: {
        outputDir,
        cleanOutput: false,
        moduleResolution: 'esm',
        include: ['users'],
      },
    });

    // Old file should still exist
    expect(existsSync(`${outputDir}/tables/old-file.ts`)).toBe(true);
    const oldContent = await fs.readFile(
      `${outputDir}/tables/old-file.ts`,
      'utf8'
    );
    expect(oldContent).toBe('// old content');

    const outputFiles = await getOutputFiles(outputDir);

    for (const file of outputFiles) {
      const content = await fs.readFile(file, 'utf8');
      expect(content).toMatchSnapshot(path.relative(outputDir, file));
    }
  });
});
