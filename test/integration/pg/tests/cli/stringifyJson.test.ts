import fs from 'node:fs/promises';

import { executeCli, getOutputFiles } from '../../../utils/cli.js';
import { getProviderConnectionString } from '../../../utils/context.js';
import { getOutputDir } from '../../setup.js';

it('does not stringify JSON fields in write schemas if --stringify-json false', async () => {
  const connectionString = getProviderConnectionString('postgres');
  const outputDir = getOutputDir('noStringifyJson');

  await executeCli(
    `--provider pg --connection-string "${connectionString}" --output-dir "${outputDir}" --stringify-json false --silent --include "^posts$" --module-resolution esm`
  );

  const outputFiles = await getOutputFiles(outputDir);

  const postsFile = outputFiles.find((file) =>
    file.includes('posts/schema.ts')
  );

  expect(postsFile).toBeDefined();
  const content = await fs.readFile(postsFile!, 'utf8');
  // Should not contain JSON.stringify transforms in write schemas (check for presence of write schema with metadata field)
  expect(content).not.toMatch(
    /metadata.*JSON\.stringify|JSON\.stringify.*metadata/s
  );
});
