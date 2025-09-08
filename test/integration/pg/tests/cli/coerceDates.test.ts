import fs from 'node:fs/promises';

import { executeCli, getOutputFiles } from '../../../utils/cli.js';
import { getProviderConnectionString } from '../../../utils/context.js';
import { getOutputDir } from '../../setup.js';

it('does not coerce dates when --coerce-dates option is false', async () => {
  const outputDir = getOutputDir('noCoerceDates');
  const connectionString = getProviderConnectionString('postgres');

  await executeCli(
    `--provider pg --connection-string "${connectionString}" --output-dir "${outputDir}" --coerce-dates false --silent --include users --module-resolution esm`
  );

  const outputFiles = await getOutputFiles(outputDir);
  const usersFile = outputFiles.find((file) =>
    file.includes('users/schema.ts')
  );

  expect(usersFile).toBeDefined();
  const content = await fs.readFile(usersFile!, 'utf8');
  expect(content).not.toMatch(/z\.coerce\.date\(\)/);
});
