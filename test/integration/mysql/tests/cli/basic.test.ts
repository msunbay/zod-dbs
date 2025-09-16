import fs from 'node:fs/promises';
import path from 'node:path';

import { executeCli, getOutputFiles } from '../../../utils/cli.js';
import { getProviderConnectionString } from '../../../utils/context.js';
import { getOutputDir } from '../../setup.js';

it('CLI generates correct zod schemas with basic options', async () => {
  const connectionString = getProviderConnectionString('mysql');
  const outputDir = getOutputDir('basic');

  await executeCli(
    `--provider mysql --connection-string "${connectionString}" --output-dir "${outputDir}" --silent --module-resolution esm --schema-name test`
  );

  const outputFiles = await getOutputFiles(outputDir);

  for (const file of outputFiles) {
    const content = await fs.readFile(file, 'utf8');
    expect(content).toMatchSnapshot(path.relative(outputDir, file));
  }
});
