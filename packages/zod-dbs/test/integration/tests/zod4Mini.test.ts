import fs from 'fs';
import path from 'path';

import { generateZodSchemas } from '../../../src/generateZodSchemas.js';
import {
  createTestProvider,
  getOutputDir,
  getOutputFiles,
} from '../testDbUtils.js';

const provider = createTestProvider();

it('generates schemas compatible with zod version 4 mini', async () => {
  const outputDir = getOutputDir('zod4Mini');

  await generateZodSchemas({
    provider,
    config: {
      outputDir,
      moduleResolution: 'esm',
      zodVersion: '4-mini',
      include: ['users'],
    },
  });

  const outputFiles = await getOutputFiles(outputDir);

  for (const file of outputFiles) {
    const content = fs.readFileSync(file, 'utf8');
    expect(content).toMatchSnapshot(path.relative(outputDir, file));
  }
});
