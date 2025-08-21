import fs from 'fs';
import path from 'path';

import { generateZodSchemas } from '../../../src/generateZodSchemas.js';
import {
  createTestConnector,
  getOutputDir,
  getOutputFiles,
} from '../testDbUtils.js';

const connector = createTestConnector();

describe('include and exclude options', () => {
  it('generates schemas for specific tables using include string', async () => {
    const outputDir = getOutputDir('includeExclude', 'include-string');

    await generateZodSchemas(connector, {
      moduleResolution: 'esm',
      outputDir,
      include: 'users',
    });

    const outputFiles = await getOutputFiles(outputDir);
    const tableFiles = outputFiles.filter((file) => file.includes('/tables/'));

    // Should only have users table file (plus index.ts)
    expect(tableFiles.filter((f) => !f.includes('index.ts'))).toHaveLength(1);
    expect(tableFiles.some((file) => file.includes('users'))).toBe(true);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatchSnapshot(path.relative(outputDir, file));
    }
  });

  it('generates schemas for specific tables using include array', async () => {
    const outputDir = getOutputDir('includeExclude', 'include-array');

    await generateZodSchemas(connector, {
      moduleResolution: 'esm',
      outputDir,
      include: ['users', 'posts'],
    });

    const outputFiles = await getOutputFiles(outputDir);
    const tableFiles = outputFiles.filter((file) => file.includes('/tables/'));

    // Should have users and posts table files (plus index.ts)
    expect(tableFiles.filter((f) => !f.includes('index.ts'))).toHaveLength(2);
    expect(tableFiles.some((file) => file.includes('users'))).toBe(true);
    expect(tableFiles.some((file) => file.includes('posts'))).toBe(true);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatchSnapshot(path.relative(outputDir, file));
    }
  });

  it('generates schemas excluding specific tables using exclude string', async () => {
    const outputDir = getOutputDir('includeExclude', 'exclude-string');

    await generateZodSchemas(connector, {
      moduleResolution: 'esm',
      outputDir,
      exclude: 'posts',
    });

    const outputFiles = await getOutputFiles(outputDir);
    const tableFiles = outputFiles.filter((file) => file.includes('/tables/'));

    // Should not have posts table file
    expect(tableFiles.every((file) => !file.includes('posts'))).toBe(true);
    expect(tableFiles.some((file) => file.includes('users'))).toBe(true);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatchSnapshot(path.relative(outputDir, file));
    }
  });

  it('generates schemas excluding multiple tables using exclude array', async () => {
    const outputDir = getOutputDir('includeExclude', 'exclude-array');

    await generateZodSchemas(connector, {
      moduleResolution: 'esm',
      outputDir,
      exclude: ['posts', 'users'],
    });

    const outputFiles = await getOutputFiles(outputDir);
    const tableFiles = outputFiles.filter((file) => file.includes('/tables/'));

    // Should not have posts or users table files
    expect(
      tableFiles.every(
        (file) => !file.includes('posts') && !file.includes('users')
      )
    ).toBe(true);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatchSnapshot(path.relative(outputDir, file));
    }
  });

  it('respects both include and exclude options (exclude takes precedence)', async () => {
    const outputDir = getOutputDir(
      'includeExclude',
      'include-exclude-combined'
    );

    await generateZodSchemas(connector, {
      moduleResolution: 'esm',
      outputDir,
      include: ['users', 'posts'],
      exclude: ['posts'],
    });

    const outputFiles = await getOutputFiles(outputDir);
    const tableFiles = outputFiles.filter((file) => file.includes('/tables/'));

    // Should only have users (posts is excluded even though included)
    expect(tableFiles.filter((f) => !f.includes('index.ts'))).toHaveLength(1);
    expect(tableFiles.some((file) => file.includes('users'))).toBe(true);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatchSnapshot(path.relative(outputDir, file));
    }
  });
});
