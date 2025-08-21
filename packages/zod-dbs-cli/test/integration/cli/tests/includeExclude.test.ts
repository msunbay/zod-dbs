import { execSync } from 'child_process';

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

it('CLI works with --exclude option', async () => {
  const connectionString = getClientConnectionString();
  const outputDir = getOutputDir('cli', 'includeExclude', 'exclude');

  execSync(
    `node ${cliPath} --provider pg --connection-string "${connectionString}" --output-dir "${outputDir}" --exclude posts --silent --module-resolution esm`,
    { stdio: 'inherit' }
  );

  const outputFiles = await getOutputFiles(outputDir);
  const hasPostsFile = outputFiles.some((file) =>
    file.includes('posts/schema.ts')
  );

  expect(hasPostsFile).toBe(false);
});

it('CLI works with --include option', async () => {
  const connectionString = getClientConnectionString();
  const outputDir = getOutputDir('cli', 'includeExclude', 'include');

  execSync(
    `node ${cliPath} --provider pg --connection-string "${connectionString}" --output-dir "${outputDir}" --include ^users$ --silent --module-resolution esm`,
    { stdio: 'inherit' }
  );

  const outputFiles = await getOutputFiles(outputDir);
  const hasUsersFile = outputFiles.some((file) =>
    file.includes('users/schema.ts')
  );
  const hasPostsFile = outputFiles.some((file) =>
    file.includes('posts/schema.ts')
  );

  expect(hasUsersFile).toBe(true);
  expect(hasPostsFile).toBe(false);
});
