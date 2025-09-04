import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import { getOutputFiles } from '../../utils.js';
import { getConnectionConfig, getOutputDir } from '../testDbUtils.js';

const cliPath = path.resolve(import.meta.dirname, '../../../../index.js');

it('CLI generates correct zod schemas with env vars', async () => {
  const outputDir = getOutputDir('cli', 'envVars');
  const config = getConnectionConfig();

  process.env.ZOD_DBS_USER = config.user;
  process.env.ZOD_DBS_PASSWORD = config.password;
  process.env.ZOD_DBS_HOST = config.host;
  process.env.ZOD_DBS_PORT = config.port?.toString();
  process.env.ZOD_DBS_DATABASE = config.database;

  execSync(
    `node ${cliPath} --provider pg --output-dir "${outputDir}" --silent --module-resolution esm --schema-name public`,
    { stdio: 'inherit' }
  );

  const outputFiles = await getOutputFiles(outputDir);

  for (const file of outputFiles) {
    const content = fs.readFileSync(file, 'utf8');
    expect(content).toMatchSnapshot(path.relative(outputDir, file));
  }
});
