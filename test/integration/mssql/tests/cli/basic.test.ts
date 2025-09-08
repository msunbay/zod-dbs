import fs from 'node:fs/promises';
import path from 'node:path';

import {
  executeCli,
  getOutputFiles,
  getProviderOutputDir,
} from '../../../utils/cli.js';
import { getConnectionString } from '../../context.js';

it('CLI generates correct zod schemas with basic options', async () => {
  const connectionString = getConnectionString();
  const outputDir = getProviderOutputDir('mssql', 'basic');

  await executeCli(
    `--provider mssql --connection-string "${connectionString}" --include "users" --output-dir "${outputDir}" --module-resolution esm`
  );

  const outputFiles = await getOutputFiles(outputDir);

  for (const file of outputFiles) {
    const content = await fs.readFile(file, 'utf8');
    expect(content).toMatchSnapshot(path.relative(outputDir, file));
  }
});
