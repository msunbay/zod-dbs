import { executeCli } from '../../../utils/cli.js';

it('outputs provider help', async () => {
  const output = await executeCli(`--provider snowflake --help`);

  expect(output).toMatchSnapshot();
});
