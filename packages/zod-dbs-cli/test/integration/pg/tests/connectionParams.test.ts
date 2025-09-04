import { execSync } from 'child_process';

import { getCliPath, getOutputFiles } from '../../utils.js';
import { getClientConnectionString, getOutputDir } from '../testDbUtils.js';

const cliPath = getCliPath();

it('CLI works with connection parameters instead of connection string', async () => {
  const outputDir = getOutputDir('connectionParams');

  // Use the same connection details as the test database
  const connectionString = getClientConnectionString();
  const url = new URL(connectionString);

  execSync(
    `node ${cliPath} --provider pg --host ${url.hostname} --port ${url.port} --database ${url.pathname.slice(1)} --user ${url.username} --password ${url.password} --output-dir "${outputDir}" --silent --include users --module-resolution esm`,
    { stdio: 'inherit' }
  );

  const outputFiles = await getOutputFiles(outputDir);
  expect(outputFiles.length).toBeGreaterThan(0);
});
