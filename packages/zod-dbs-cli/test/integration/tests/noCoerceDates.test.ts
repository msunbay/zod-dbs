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
} from '../testDbUtils.js';

let ctx: TestDbContext;

const cliPath = getCliPath();

beforeAll(async () => {
  ctx = await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb(ctx);
});

it('CLI works with --no-coerce-dates option', async () => {
  const outputDir = getOutputDir('cli', 'noCoerceDates');
  const connectionString = getClientConnectionString();

  execSync(
    `node ${cliPath} --provider pg --connection-string "${connectionString}" --output-dir "${outputDir}" --no-coerce-dates --silent --include users --module-resolution esm`,
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
