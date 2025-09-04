import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import { getCliPath, getOutputFiles } from '../../utils.js';
import { getConnectionConfig, getOutputDir } from '../testDbUtils.js';

const cliPath = getCliPath();

it('CLI generates correct zod schemas with basic options', async () => {
  const outputDir = getOutputDir('basic');
  const config = getConnectionConfig();

  execSync(
    `node ${cliPath} --provider dynamodb --endpoint "${config.endpoint}" --output-dir "${outputDir}" --silent --module-resolution esm`,
    { stdio: 'inherit' }
  );

  const outputFiles = await getOutputFiles(outputDir);

  for (const file of outputFiles) {
    const content = fs.readFileSync(file, 'utf8');
    expect(content).toMatchSnapshot(path.relative(outputDir, file));
  }
});
