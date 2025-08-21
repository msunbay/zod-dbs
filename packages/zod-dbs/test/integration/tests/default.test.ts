import fs from 'fs';
import path from 'path';

import { generateZodSchemas } from '../../../src/generateZodSchemas.js';
import {
  createTestConnector,
  getOutputDir,
  getOutputFiles,
} from '../testDbUtils.js';

const connector = createTestConnector();

it('generates correct zod schemas with default options', async () => {
  const outputDir = getOutputDir('default');

  await generateZodSchemas(connector, {
    outputDir,
    moduleResolution: 'esm',
  });

  const outputFiles = await getOutputFiles(outputDir);

  for (const file of outputFiles) {
    const content = fs.readFileSync(file, 'utf8');
    expect(content).toMatchSnapshot(path.relative(outputDir, file));
  }
});
