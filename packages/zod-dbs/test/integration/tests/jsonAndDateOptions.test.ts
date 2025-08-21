import fs from 'fs';
import path from 'path';

import { generateZodSchemas } from '../../../src/generateZodSchemas.js';
import {
  createTestConnector,
  getOutputDir,
  getOutputFiles,
} from '../testDbUtils.js';

const connector = createTestConnector();

describe('JSON and date handling options', () => {
  it('generates schemas with stringifyJson enabled', async () => {
    const outputDir = getOutputDir('jsonAndDateOptions', 'stringify-json');

    await generateZodSchemas(connector, {
      moduleResolution: 'esm',
      outputDir,
      include: ['posts'],
    });

    const outputFiles = await getOutputFiles(outputDir);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatchSnapshot(path.relative(outputDir, file));
    }
  });

  it('generates schemas with stringifyJson disabled', async () => {
    const outputDir = getOutputDir('jsonAndDateOptions', 'no-stringify-json');

    await generateZodSchemas(connector, {
      moduleResolution: 'esm',
      outputDir,
      stringifyJson: false,
      include: ['posts'],
    });

    const outputFiles = await getOutputFiles(outputDir);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).not.toMatch(/JSON\.stringify/);
      expect(content).toMatchSnapshot(path.relative(outputDir, file));
    }
  });

  it('generates schemas with stringifyDates enabled', async () => {
    const outputDir = getOutputDir('jsonAndDateOptions', 'stringify-dates');

    await generateZodSchemas(connector, {
      moduleResolution: 'esm',
      outputDir,
      stringifyDates: true,
      include: ['users'],
    });

    const outputFiles = await getOutputFiles(outputDir);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatchSnapshot(path.relative(outputDir, file));
    }
  });

  it('generates schemas with defaultEmptyArray enabled', async () => {
    const outputDir = getOutputDir('jsonAndDateOptions', 'default-empty-array');

    await generateZodSchemas(connector, {
      moduleResolution: 'esm',
      outputDir,
      defaultEmptyArray: true,
      include: ['users'],
    });

    const outputFiles = await getOutputFiles(outputDir);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      expect(content).toMatchSnapshot(path.relative(outputDir, file));
    }
  });

  it('generates schemas with coerceDates enabled', async () => {
    const outputDir = getOutputDir('jsonAndDateOptions', 'coerce-dates');

    await generateZodSchemas(connector, {
      moduleResolution: 'esm',
      outputDir,
      coerceDates: true,
      include: ['users'],
    });

    const outputFiles = await getOutputFiles(outputDir);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      if (file.includes('users.ts')) {
        expect(content).toMatch(/z\.coerce\.date\(\)/);
      }
      expect(content).toMatchSnapshot(path.relative(outputDir, file));
    }
  });

  it('generates schemas with coerceDates disabled', async () => {
    const outputDir = getOutputDir(
      'jsonAndDateOptions',
      'coerce-dates-disabled'
    );

    await generateZodSchemas(connector, {
      moduleResolution: 'esm',
      outputDir,
      coerceDates: false,
      include: ['users'],
    });

    const outputFiles = await getOutputFiles(outputDir);

    for (const file of outputFiles) {
      const content = fs.readFileSync(file, 'utf8');
      if (file.includes('users.ts')) {
        expect(content).not.toMatch(/z\.coerce\.date\(\)/);
      }
      expect(content).toMatchSnapshot(path.relative(outputDir, file));
    }
  });
});
