import { execSync } from 'child_process';

import { getCliPath } from '../../utils.js';

const cliPath = getCliPath();

it('outputs provider options', async () => {
  const output = execSync(`node ${cliPath} --provider dynamodb --help`, {
    stdio: 'pipe',
  });

  expect(output.toString()).toMatchSnapshot();
});
