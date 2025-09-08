import fs from 'node:fs/promises';

import { executeCli, getOutputFiles } from '../../../utils/cli.js';
import { getProviderConnectionString } from '../../../utils/context.js';
import { getOutputDir } from '../../setup.js';

it('does not transform case when --case-transform option is false', async () => {
  const outputDir = getOutputDir('noCaseTransform');
  const connectionString = getProviderConnectionString('postgres');

  await executeCli(
    `--provider pg --connection-string "${connectionString}" --output-dir "${outputDir}" --case-transform false --include "^posts$" --module-resolution esm`
  );

  const outputFiles = await getOutputFiles(outputDir);

  const postsFile = outputFiles.find((file) =>
    file.includes('posts/schema.ts')
  );

  expect(postsFile).toBeDefined();
  const content = await fs.readFile(postsFile!, 'utf8');

  // Should not contain case transformations in schema (check for presence of transform function)
  expect(content).not.toMatch(/transformUserBaseRecord/s);
});
