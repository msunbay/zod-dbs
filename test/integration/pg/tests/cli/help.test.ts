import { executeCli } from '../../../utils/cli.js';

it('outputs provider help', async () => {
  const output = await executeCli(`--provider pg --help`);

  expect(output).toMatchSnapshot();
});
