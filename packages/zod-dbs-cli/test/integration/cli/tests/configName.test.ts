import { execSync } from 'child_process';
import { toError } from 'zod-dbs-core';

import { getCliPath } from '../../utils.js';

const cliPath = getCliPath();

it('CLI accepts custom config file name', async () => {
  const output = execSync(`node ${cliPath} --config-name test`, {
    stdio: 'pipe',
  });

  expect(output.toString()).toMatchSnapshot();
});

it('CLI fails if custom config file name does not exist', async () => {
  let error: Error | undefined;

  try {
    execSync(`node ${cliPath} --config-name nonexisting`, {
      stdio: 'pipe',
    });
  } catch (err) {
    error = toError(err);
  }

  expect(error).toBeDefined();
  expect(error!.message).toContain(
    'Failed to load configuration from file "zod-dbs-nonexisting"'
  );
});
