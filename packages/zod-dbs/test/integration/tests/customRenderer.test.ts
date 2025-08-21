import fs from 'fs';
import path from 'path';

import { Zod4Renderer } from '../../../src/generate/renderers/Zod4Renderer.js';
import { generateZodSchemas } from '../../../src/generateZodSchemas.js';
import {
  createTestConnector,
  getOutputDir,
  getOutputFiles,
} from '../testDbUtils.js';

const connector = createTestConnector();

it('generates schemas using a custom renderer', async () => {
  const outputDir = getOutputDir('generate', 'customRenderer');

  class CustomRenderer extends Zod4Renderer {
    protected override renderReadField() {
      return `z.unknown()`;
    }

    protected override renderWriteField() {
      return `z.unknown()`;
    }
  }

  const renderer = new CustomRenderer();

  await generateZodSchemas(connector, {
    outputDir,
    moduleResolution: 'esm',
    include: ['users'],
    renderer,
  });

  const outputFiles = await getOutputFiles(outputDir);

  for (const file of outputFiles) {
    const content = fs.readFileSync(file, 'utf8');
    expect(content).toMatchSnapshot(path.relative(outputDir, file));
  }
});
