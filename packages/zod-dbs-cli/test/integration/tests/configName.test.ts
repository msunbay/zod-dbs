import { toError } from 'zod-dbs-core';

import type { CliExecutionError } from '../../../../../test/integration/utils/cli.js';

import { executeCli } from '../../../../../test/integration/utils/cli.js';

it('CLI accepts custom config file name', async () => {
  const output = await executeCli(`--config-name test`);

  expect(output).toMatchSnapshot();
});

it('CLI fails if custom config file name does not exist', async () => {
  let error: CliExecutionError | undefined;

  try {
    await executeCli(`--config-name nonexisting`, { logErrors: false });
  } catch (err) {
    error = toError(err);
  }

  expect(error).toBeDefined();
  expect(error!.stderr).toContain(
    'Failed to load configuration from file "zod-dbs-nonexisting"'
  );
});
