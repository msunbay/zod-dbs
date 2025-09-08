import fs from 'node:fs';
import path from 'node:path';

import { executeCli, getOutputFiles } from '../../../utils/cli.js';
import { getProviderConfig } from '../../../utils/context.js';
import { getOutputDir } from '../../setup.js';

it('CLI generates correct zod schemas with env vars', async () => {
  const outputDir = getOutputDir('envVars');
  const config = getProviderConfig();

  process.env.ZOD_DBS_USER = config.user;
  process.env.ZOD_DBS_PASSWORD = config.password;
  process.env.ZOD_DBS_HOST = config.host;
  process.env.ZOD_DBS_PORT = config.port?.toString();
  process.env.ZOD_DBS_DATABASE = config.database;

  await executeCli(
    `--provider pg --output-dir "${outputDir}" --silent --module-resolution esm --schema-name public`
  );

  const outputFiles = await getOutputFiles(outputDir);

  for (const file of outputFiles) {
    const content = fs.readFileSync(file, 'utf8');
    expect(content).toMatchSnapshot(path.relative(outputDir, file));
  }
});
