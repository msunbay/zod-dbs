import fs from 'node:fs/promises';
import path from 'node:path';

import {
  executeCli,
  getOutputFiles,
  getProviderOutputDir,
} from '../../../utils/cli.js';
import { getProviderConnectionString } from '../../../utils/context.js';

it('CLI generates correct zod schemas with basic options', async () => {
  const connectionString = getProviderConnectionString('mongodb');
  const outputDir = getProviderOutputDir('mongodb', 'basic');

  await executeCli(
    `--provider mongodb --connection-string "${connectionString}" --direct-connection --replica-set rs0 --output-dir "${outputDir}" --silent --module-resolution esm`
  );

  const outputFiles = await getOutputFiles(outputDir);

  for (const file of outputFiles) {
    const content = await fs.readFile(file, 'utf8');
    expect(content).toMatchSnapshot(path.relative(outputDir, file));
  }
});
