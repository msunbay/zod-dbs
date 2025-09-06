import { execSync } from 'child_process';
import fs from 'fs';

import { getCliPath, getOutputFiles } from '../../../utils.js';
import { getClientConnectionString, getOutputDir } from '../testDbUtils.js';

const cliPath = getCliPath();

it('CLI works with --no-coerce-dates option', async () => {
  const outputDir = getOutputDir('noCoerceDates');
  const connectionString = getClientConnectionString();

  execSync(
    `node ${cliPath} --provider pg --connection-string "${connectionString}" --output-dir "${outputDir}" --coerce-dates false --silent --include users --module-resolution esm`,
    { stdio: 'inherit' }
  );

  const outputFiles = await getOutputFiles(outputDir);
  const usersFile = outputFiles.find((file) =>
    file.includes('users/schema.ts')
  );

  expect(usersFile).toBeDefined();
  const content = fs.readFileSync(usersFile!, 'utf8');
  expect(content).not.toMatch(/z\.coerce\.date\(\)/);
});
