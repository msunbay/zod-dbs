import fs from 'node:fs';
import path from 'node:path';

import { executeCli, getOutputFiles } from '../../../utils/cli.js';
import { getProviderConnectionString } from '../../../utils/context.js';
import { getOutputDir } from '../../setup.js';

it('CLI generates correct zod schemas with basic options', async () => {
  const connectionString = getProviderConnectionString('postgres');
  const outputDir = getOutputDir('basic');

  await executeCli(
    `--provider pg --connection-string "${connectionString}" --output-dir "${outputDir}" --include "users" --silent --module-resolution esm --schema-name public`
  );

  const outputFiles = await getOutputFiles(outputDir);

  for (const file of outputFiles) {
    const content = fs.readFileSync(file, 'utf8');
    expect(content).toMatchSnapshot(path.relative(outputDir, file));
  }
});
