import fs from 'fs';
import path from 'path';

import { executeCli, getOutputFiles } from '../../../utils.js';
import { getClientConnectionString, getOutputDir } from '../testDbUtils.js';

it('CLI generates correct zod schemas with basic options', async () => {
  const connectionString = getClientConnectionString();
  const outputDir = getOutputDir('basic');

  executeCli(
    `--provider mongodb --connection-string "${connectionString}" --direct-connection --replica-set rs0 --output-dir "${outputDir}" --silent --module-resolution esm`
  );

  const outputFiles = await getOutputFiles(outputDir);

  for (const file of outputFiles) {
    const content = fs.readFileSync(file, 'utf8');
    expect(content).toMatchSnapshot(path.relative(outputDir, file));
  }
});
