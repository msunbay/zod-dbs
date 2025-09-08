import { executeCli, getOutputFiles } from '../../../utils/cli.js';
import { getProviderConnectionString } from '../../../utils/context.js';
import { getOutputDir } from '../../setup.js';

it('CLI works with connection parameters instead of connection string', async () => {
  const outputDir = getOutputDir('connectionParams');

  const connectionString = getProviderConnectionString('postgres');
  const url = new URL(connectionString);

  await executeCli(
    `--provider pg --host ${url.hostname} --port ${url.port} --database ${url.pathname.slice(1)} --user ${url.username} --password ${url.password} --output-dir "${outputDir}" --silent --include users --module-resolution esm`
  );

  const outputFiles = await getOutputFiles(outputDir);
  expect(outputFiles.length).toBeGreaterThan(0);
});
