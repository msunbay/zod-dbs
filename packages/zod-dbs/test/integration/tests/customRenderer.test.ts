import fs from 'fs';
import path from 'path';

import { generateZodSchemas } from '../../../src/generateZodSchemas.js';
import { Zod4Renderer } from '../../../src/renderers/Zod4Renderer.js';
import {
  createTestProvider,
  getOutputDir,
  getOutputFiles,
} from '../testDbUtils.js';

const provider = createTestProvider();

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

  await generateZodSchemas({
    provider,
    renderer,
    config: {
      outputDir,
      moduleResolution: 'esm',
      include: ['users'],
    },
  });

  const outputFiles = await getOutputFiles(outputDir);

  for (const file of outputFiles) {
    const content = fs.readFileSync(file, 'utf8');
    expect(content).toMatchSnapshot(path.relative(outputDir, file));
  }
});
