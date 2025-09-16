import fs from 'node:fs/promises';

import { executeCli, getOutputFiles } from '../../../utils/cli.js';
import { getProviderConnectionString } from '../../../utils/context.js';
import { getOutputDir } from '../../setup.js';

it('CLI works with --zod-version option', async () => {
  const connectionString = getProviderConnectionString('postgres');
  const outputDir = getOutputDir('zodVersion', 'zod-version-4');

  await executeCli(
    `--provider pg --connection-string "${connectionString}" --output-dir "${outputDir}" --zod-version 4 --silent --include orders --module-resolution esm`
  );

  const outputFiles = await getOutputFiles(outputDir);
  const usersFile = outputFiles.find((file) =>
    file.includes('orders/schema.ts')
  );

  expect(usersFile).toBeDefined();
  const content = await fs.readFile(usersFile!, 'utf8');

  // Zod v4 uses z.int() instead of z.number().int()
  expect(content).toMatch(/z\.int\(\)/);
});
