import { OracleProvider } from '../../../src/OracleProvider.js';

describe('OracleProvider', () => {
  it('returns isEnum = true for columns with check constraints', async () => {
    class TestOracleProvider extends OracleProvider {
      // override createClient to return a stubbed client
      async createClient(_options: any) {
        return {
          connect: async () => {},
          // query should return an array of rows as the real provider expects
          query: async (_q: any) => {
            return [
              {
                TABLE_NAME: 'MY_TABLE',
                COLUMN_NAME: 'MY_COLUMN',
                DATA_TYPE: 'VARCHAR2',
                NULLABLE: 'N',
                DATA_LENGTH: 255,
                DATA_DEFAULT: null,
                COMMENTS: null,
                TABLE_TYPE: 'table',
                CHECK_CONSTRAINTS_VC:
                  "my_column in ('admin','editor','viewer')",
              },
            ];
          },
          end: async () => {},
        } as any;
      }
    }

    const provider = new TestOracleProvider();
    const cols = await provider.fetchSchemaInfo({ user: 'me' });

    expect(cols).toHaveLength(1);
    expect(cols[0].name).toBe('my_column');
    expect(cols[0].dataType).toBe('varchar2');
    expect(cols[0].tableName).toBe('my_table');
    expect(cols[0].isNullable).toBe(false);
    expect(cols[0].maxLen).toBe(255);
    expect(cols[0].defaultValue).toBeUndefined();
    expect(cols[0].description).toBeUndefined();
    expect(cols[0].isSerial).toBe(false);
    expect(cols[0].isArray).toBe(false);
    expect(cols[0].isEnum).toBe(true);
    expect(cols[0].enumValues).toEqual(['admin', 'editor', 'viewer']);
  });
});
