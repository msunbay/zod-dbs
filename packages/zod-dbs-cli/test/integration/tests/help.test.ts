import type { CliExecutionError } from '../../../../../test/integration/utils/cli.js';

import { executeCli } from '../../../../../test/integration/utils/cli.js';

it('outputs error on invalid provider', async () => {
  try {
    await executeCli(`--provider apple --help`, { logErrors: false });
  } catch (err: any) {
    const error = err as CliExecutionError;

    expect(error.status).toBe(1);
    expect(error.stderr).toContain(`Failed to import provider apple`);
  }
});

it('outputs error on missing provider', async () => {
  try {
    await executeCli(`--help`, { logErrors: false });
  } catch (err: any) {
    const error = err as CliExecutionError;

    expect(error.status).toBe(1);
    expect(error.stderr).toContain(
      `Provider must be specified through the --provider flag or in a config file`
    );
  }
});
