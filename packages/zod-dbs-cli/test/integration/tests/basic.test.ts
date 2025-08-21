import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

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

it('CLI generates correct zod schemas with basic options', async () => {
  const connectionString = getClientConnectionString();
  const outputDir = getOutputDir('cli', 'basic');

  execSync(
    `node ${cliPath} --provider pg --connection-string "${connectionString}" --output-dir "${outputDir}" --silent --module-resolution esm --schema-name public`,
    { stdio: 'inherit' }
  );

  const outputFiles = await getOutputFiles(outputDir);

  for (const file of outputFiles) {
    const content = fs.readFileSync(file, 'utf8');
    expect(content).toMatchSnapshot(path.relative(outputDir, file));
  }
});
