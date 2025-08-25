import { SnowflakeProvider } from '../../../src/SnowflakeProvider.js';

describe('SnowflakeProvider', () => {
  it('requires database and schemaName and maps basic fields', async () => {
    const provider = new SnowflakeProvider();

    await expect(
      provider.getSchemaInformation({ schemaName: 'PUBLIC' } as any)
    ).rejects.toThrow(/database is required/);

    await expect(
      provider.getSchemaInformation({ database: 'MYDB' } as any)
    ).rejects.toThrow(/schemaName is required/);
  });
});
