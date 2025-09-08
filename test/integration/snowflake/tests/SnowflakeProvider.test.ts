import { SnowflakeProvider } from 'zod-dbs-snowflake';

import { getProviderConfig } from '../../utils/context.js';

const IS_CONFIGURED = !!process.env.SNOWFLAKE_HOST;
const describeIntegration = IS_CONFIGURED ? describe : describe.skip;

describeIntegration('SnowflakeProvider', () => {
  it('fetches schema info for provided database/schema', async () => {
    const provider = new SnowflakeProvider();
    const config = getProviderConfig();

    const info = await provider.getSchemaInformation(config);

    expect(info.tables).toBeDefined();
    expect(info).toMatchSnapshot();
  });
});
