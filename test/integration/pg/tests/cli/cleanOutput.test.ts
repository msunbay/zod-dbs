import fs from 'node:fs';
import path from 'node:path';

import {
  deleteOutputFiles,
  executeCli,
  getOutputFiles,
} from '../../../utils/cli.js';
import { getProviderConnectionString } from '../../../utils/context.js';
import { getOutputDir } from '../../setup.js';

const outputDir = getOutputDir('cleanOutput');

afterAll(async () => {
  await deleteOutputFiles(outputDir);
});

it('CLI works with --clean-output option', async () => {
  // Create the directory with a dummy .ts file (clearTablesDirectory only removes .ts files)
  fs.mkdirSync(outputDir, { recursive: true });
  const dummyFile = path.join(outputDir, 'dummy.ts');
  fs.writeFileSync(dummyFile, 'export const dummy = "test";');

  // Verify dummy file exists before running command
  expect(fs.existsSync(dummyFile)).toBe(true);

  const connectionString = getProviderConnectionString('postgres');

  await executeCli(
    `--provider pg --connection-string "${connectionString}" --output-dir "${outputDir}" --clean-output --silent --include users --module-resolution esm`
  );

  // Check that dummy file was removed (clearTablesDirectory removes .ts files)
  const dummyExists = fs.existsSync(dummyFile);
  expect(dummyExists).toBe(false);

  // Check that new files were generated
  const outputFiles = await getOutputFiles(outputDir);
  expect(outputFiles.length).toBeGreaterThan(0);
});
