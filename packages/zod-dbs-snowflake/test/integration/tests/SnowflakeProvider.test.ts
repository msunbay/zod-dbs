import { createProvider } from '../../../src/provider.js';
import {
  getConnectionConfig,
  setupTestDb,
  teardownTestDb,
  TestDbContext,
} from '../testDbUtils.js';

const IS_CONFIGURED = !!process.env.SNOWFLAKE_HOST;
const describeIntegration = IS_CONFIGURED ? describe : describe.skip;

describeIntegration('SnowflakeProvider (integration)', () => {
  let ctx: TestDbContext;

  beforeAll(async () => {
    ctx = await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb(ctx);
  });

  it('fetches schema info for provided database/schema', async () => {
    const provider = createProvider();
    const config = getConnectionConfig();

    const info = await provider.getSchemaInformation(config);

    expect(info.tables).toBeDefined();
    expect(info).toMatchSnapshot();
  });
});
