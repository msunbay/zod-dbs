import fs from 'node:fs/promises';
import path from 'node:path';

import {
  executeCli,
  getOutputFiles,
  getProviderOutputDir,
} from '../../../utils/cli.js';
import { getProviderConfig } from '../../../utils/context.js';

it('CLI generates correct zod schemas with basic options', async () => {
  const config = getProviderConfig();
  const outputDir = getProviderOutputDir('sqlite', 'basic');

  await executeCli(
    `--provider sqlite --database "${config.database}" --schema-name "${config.schemaName}" --include "users" --output-dir "${outputDir}" --module-resolution esm`
  );

  const outputFiles = await getOutputFiles(outputDir);

  expect(outputFiles.length).toBe(5);

  for (const file of outputFiles) {
    const content = await fs.readFile(file, 'utf8');
    expect(content).toMatchSnapshot(path.relative(outputDir, file));
  }
});
