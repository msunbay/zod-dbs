import { executeCli } from '../../../utils/cli.js';

it('outputs provider help', async () => {
  const output = await executeCli(`--provider dynamodb --help`);

  expect(output).toMatchSnapshot();
});
