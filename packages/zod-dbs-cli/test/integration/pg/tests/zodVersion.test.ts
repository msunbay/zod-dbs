import { execSync } from 'child_process';
import fs from 'fs';

import { getCliPath, getOutputFiles } from '../../utils.js';
import { getClientConnectionString, getOutputDir } from '../testDbUtils.js';

const cliPath = getCliPath();

it('CLI works with --zod-version option', async () => {
  const connectionString = getClientConnectionString();
  const outputDir = getOutputDir('zodVersion', 'zod-version-4');

  execSync(
    `node ${cliPath} --provider pg --connection-string "${connectionString}" --output-dir "${outputDir}" --zod-version 4 --silent --include orders --module-resolution esm`,
    { stdio: 'inherit' }
  );

  const outputFiles = await getOutputFiles(outputDir);
  const usersFile = outputFiles.find((file) =>
    file.includes('orders/schema.ts')
  );

  expect(usersFile).toBeDefined();
  const content = fs.readFileSync(usersFile!, 'utf8');

  // Zod v4 uses z.int() instead of z.number().int()
  expect(content).toMatch(/z\.int\(\)/);
});
