import { execSync } from 'child_process';
import fs from 'fs';

import { getCliPath, getOutputFiles } from '../../../utils.js';
import { getClientConnectionString, getOutputDir } from '../testDbUtils.js';

const cliPath = getCliPath();

it('CLI works with --no-case-transform option', async () => {
  const outputDir = getOutputDir('noCaseTransform');
  const connectionString = getClientConnectionString();

  execSync(
    `node ${cliPath} --provider pg --connection-string "${connectionString}" --output-dir "${outputDir}" --case-transform false --include "^posts$" --module-resolution esm`,
    { stdio: 'pipe' }
  );

  const outputFiles = await getOutputFiles(outputDir);

  const postsFile = outputFiles.find((file) =>
    file.includes('posts/schema.ts')
  );

  expect(postsFile).toBeDefined();
  const content = fs.readFileSync(postsFile!, 'utf8');

  // Should not contain case transformations in schema (check for presence of transform function)
  expect(content).not.toMatch(/transformUserBaseRecord/s);
});
