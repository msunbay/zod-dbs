import fs from 'node:fs/promises';
import path from 'node:path';

import { executeCli, getOutputFiles } from '../../../utils/cli.js';
import { getProviderConfig } from '../../../utils/context.js';
import { getOutputDir } from '../../setup.js';

it('CLI generates correct zod schemas with basic options', async () => {
  const outputDir = getOutputDir('basic');
  const config = getProviderConfig();

  await executeCli(
    `--provider dynamodb --endpoint "${config.endpoint}" --access-key-id test --secret-access-key test --output-dir "${outputDir}" --silent --module-resolution esm`
  );

  const outputFiles = await getOutputFiles(outputDir);

  for (const file of outputFiles) {
    const content = await fs.readFile(file, 'utf8');
    expect(content).toMatchSnapshot(path.relative(outputDir, file));
  }
});
