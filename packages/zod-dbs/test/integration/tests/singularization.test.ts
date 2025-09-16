import fs from 'node:fs/promises';

import { generateZodSchemas } from '../../../src/generateZodSchemas.js';
import {
  createTestProvider,
  getOutputDir,
  getOutputFiles,
} from '../testDbUtils.js';

const provider = createTestProvider();

it('generates correct zod schemas with disabled singularization', async () => {
  const outputDir = getOutputDir('noSingularization');

  await generateZodSchemas({
    provider,
    config: {
      outputDir,
      moduleResolution: 'esm',
      singularization: false,
    },
  });

  const outputFiles = await getOutputFiles(outputDir);

  const postsFile = outputFiles.find((file) =>
    file.endsWith('/posts/schema.ts')
  );

  expect(postsFile).toBeDefined();

  const content = await fs.readFile(postsFile!, 'utf8');
  expect(content).toMatchSnapshot();

  // Ensure that the singularization is not applied
  expect(content).not.toContain('PostRecord');
  expect(content).toContain('PostsRecord');
});
