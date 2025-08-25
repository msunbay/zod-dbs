import { createProvider } from '../../../src/provider.js';

// These tests are designed to be run manually with valid Snowflake credentials set via env
// (or via a local config). In CI, we skip them by default.
const SKIP = !process.env.SNOWFLAKE_DATABASE || !process.env.SNOWFLAKE_SCHEMA;

(SKIP ? describe.skip : describe)('SnowflakeProvider (integration)', () => {
  it('fetches schema info for provided database/schema', async () => {
    const provider = createProvider();

    const config = {
      host: process.env.SNOWFLAKE_HOST, // <account>.snowflakecomputing.com
      user: process.env.SNOWFLAKE_USER,
      password: process.env.SNOWFLAKE_PASSWORD,
      database: process.env.SNOWFLAKE_DATABASE!,
      schemaName: process.env.SNOWFLAKE_SCHEMA!,
      // optional extras via Snowflake client: warehouse, role
    } as any;

    const info = await provider.getSchemaInformation(config);

    expect(info.tables).toBeInstanceOf(Array);
    // Basic sanity: we got some tables or at least an empty array
    expect(info).toHaveProperty('tables');
  });
});
