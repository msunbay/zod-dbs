import { execSync } from 'child_process';
import fs from 'fs';

import {
  getClientConnectionString,
  getCliPath,
  getOutputDir,
  getOutputFiles,
  setupTestDb,
  teardownTestDb,
  TestDbContext,
} from '../../testDbUtils.js';

let ctx: TestDbContext;

const cliPath = getCliPath();

beforeAll(async () => {
  ctx = await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb(ctx);
});

it('CLI works with --no-case-transform option', async () => {
  const outputDir = getOutputDir('noCaseTransform');
  const connectionString = getClientConnectionString();

  execSync(
    `node ${cliPath} --provider pg --connection-string "${connectionString}" --output-dir "${outputDir}" --no-case-transform --silent --include "^posts$" --module-resolution esm`,
    { stdio: 'inherit' }
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
