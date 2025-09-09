import fs from 'node:fs/promises';
import path from 'node:path';

import { executeCli, getOutputFiles } from '../../../utils/cli.js';
import { getProviderConfig } from '../../../utils/context.js';
import { getOutputDir } from '../../setup.js';

it('CLI generates correct zod schemas with basic options', async () => {
  const outputDir = getOutputDir('config');
  const config = getProviderConfig();

  // Set working directory for config file resolution
  process.env.ZOD_DBS_CWD = path.join(import.meta.dirname, '../../');

  await executeCli(`--port ${config.port}`);

  const outputFiles = await getOutputFiles(outputDir);

  for (const file of outputFiles) {
    const content = await fs.readFile(file, 'utf8');
    expect(content).toMatchSnapshot(path.relative(outputDir, file));
  }
});
