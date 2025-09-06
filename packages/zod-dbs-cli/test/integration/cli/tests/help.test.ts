import { execSync } from 'child_process';

import { getCliPath } from '../../utils.js';

const cliPath = getCliPath();

it('outputs error on invalid provider', async () => {
  try {
    execSync(`node ${cliPath} --provider apple --help`, {
      stdio: 'pipe',
    });
  } catch (err: any) {
    expect(err.status).toBe(1);
    expect(err.message).toContain(`Failed to import provider apple`);
  }
});

it('outputs error on missing provider', async () => {
  try {
    execSync(`node ${cliPath} --help`, {
      stdio: 'pipe',
    });
  } catch (err: any) {
    expect(err.status).toBe(1);
    expect(err.message).toContain(
      `Provider must be specified through the --provider flag or in a config file`
    );
  }
});
