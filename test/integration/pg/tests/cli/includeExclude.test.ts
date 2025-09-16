import { executeCli, getOutputFiles } from '../../../utils/cli.js';
import { getProviderConnectionString } from '../../../utils/context.js';
import { getOutputDir } from '../../setup.js';

it('CLI works with --exclude option', async () => {
  const connectionString = getProviderConnectionString('postgres');
  const outputDir = getOutputDir('includeExclude', 'exclude');

  await executeCli(
    `--provider pg --connection-string "${connectionString}" --output-dir "${outputDir}" --exclude posts --silent --module-resolution esm`
  );

  const outputFiles = await getOutputFiles(outputDir);
  expect(outputFiles.length).toBeGreaterThan(0);

  const hasUsersFile = outputFiles.some((file) =>
    file.includes('users/schema.ts')
  );
  const hasPostsFile = outputFiles.some((file) =>
    file.includes('posts/schema.ts')
  );

  expect(hasUsersFile).toBe(true);
  expect(hasPostsFile).toBe(false);
});

it('CLI works with --include option', async () => {
  const connectionString = getProviderConnectionString('postgres');
  const outputDir = getOutputDir('includeExclude', 'include');

  await executeCli(
    `--provider pg --connection-string "${connectionString}" --output-dir "${outputDir}" --include ^users$ --silent --module-resolution esm`
  );

  const outputFiles = await getOutputFiles(outputDir);
  expect(outputFiles.length).toBeGreaterThan(0);

  const hasUsersFile = outputFiles.some((file) =>
    file.includes('users/schema.ts')
  );
  const hasPostsFile = outputFiles.some((file) =>
    file.includes('posts/schema.ts')
  );

  expect(hasUsersFile).toBe(true);
  expect(hasPostsFile).toBe(false);
});
