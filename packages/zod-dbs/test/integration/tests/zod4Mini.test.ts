import fs from 'node:fs/promises';
import path from 'node:path';

import { generateZodSchemas } from '../../../src/generateZodSchemas.js';
import {
  createTestProvider,
  getOutputDir,
  getOutputFiles,
} from '../testDbUtils.js';

const provider = createTestProvider();

it('generates schemas compatible with zod version 4 mini', async () => {
  const outputDir = getOutputDir('zod4Mini', 'default');

  await generateZodSchemas({
    provider,
    config: {
      outputDir,
      moduleResolution: 'esm',
      zodVersion: '4-mini',
    },
  });

  const outputFiles = await getOutputFiles(outputDir);

  for (const file of outputFiles) {
    const content = await fs.readFile(file, 'utf8');
    expect(content).toMatchSnapshot(path.relative(outputDir, file));
  }
});

it('renders without case transforms when "caseTransform" is false', async () => {
  const outputDir = getOutputDir('zod4Mini', 'noCaseTransform');

  await generateZodSchemas({
    provider,
    config: {
      outputDir,
      moduleResolution: 'esm',
      zodVersion: '4-mini',
      caseTransform: false,
    },
  });

  const outputFiles = await getOutputFiles(outputDir);

  for (const file of outputFiles) {
    const content = await fs.readFile(file, 'utf8');
    expect(content).toMatchSnapshot(path.relative(outputDir, file));
  }
});
