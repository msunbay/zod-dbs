import { execSync } from 'child_process';
import fs from 'fs';

import { getCliPath, getOutputFiles } from '../../utils.js';
import { getClientConnectionString, getOutputDir } from '../testDbUtils.js';

const cliPath = getCliPath();

it('CLI works with --no-stringify-json option', async () => {
  const connectionString = getClientConnectionString();
  const outputDir = getOutputDir('noStringifyJson');

  execSync(
    `node ${cliPath} --provider pg --connection-string "${connectionString}" --output-dir "${outputDir}" --no-stringify-json --silent --include "^posts$" --module-resolution esm`,
    { stdio: 'inherit' }
  );

  const outputFiles = await getOutputFiles(outputDir);

  const postsFile = outputFiles.find((file) =>
    file.includes('posts/schema.ts')
  );

  expect(postsFile).toBeDefined();
  const content = fs.readFileSync(postsFile!, 'utf8');
  // Should not contain JSON.stringify transforms in write schemas (check for presence of write schema with metadata field)
  expect(content).not.toMatch(
    /metadata.*JSON\.stringify|JSON\.stringify.*metadata/s
  );
});
