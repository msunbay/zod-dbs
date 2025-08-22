import type { ZodDbsColumnInfo, ZodDbsTableType } from '../../../src/types.js';

import { ZodDbsBaseProvider } from '../../../src/ZodDbsBaseProvider.js';

// Helpers
const createRaw = (
  overrides: Partial<ZodDbsColumnInfo> = {}
): ZodDbsColumnInfo => ({
  tableName: 'users',
  name: 'id',
  defaultValue: undefined,
  dataType: 'int4',
  isNullable: false,
  maxLen: undefined,
  description: undefined,
  tableType: 'table' as ZodDbsTableType,
  schemaName: 'public',
  isEnum: false,
  isArray: false,
  isSerial: false,
  ...overrides,
});

interface MockClient {
  connect: ReturnType<typeof vi.fn>;
  query: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
}

class TestProvider extends ZodDbsBaseProvider {
  mockClient: MockClient;

  constructor(options: { mockClient: MockClient }) {
    super({ name: 'test', displayName: 'Test Provider' });
    this.mockClient = options.mockClient;
  }

  protected override fetchSchemaInfo() {
    return this.mockClient.query(`SELECT * FROM information_schema.columns`);
  }
}

const buildConnector = (rows: ZodDbsColumnInfo[]) => {
  const mockClient: MockClient = {
    connect: vi.fn().mockResolvedValue(undefined),
    query: vi.fn().mockResolvedValue(rows),
    end: vi.fn().mockResolvedValue(undefined),
  } as any;

  return new TestProvider({ mockClient });
};

describe('ZodDbsBaseProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retrieves and groups columns into tables', async () => {
    const rows = [
      createRaw({ tableName: 'users', name: 'id' }),
      createRaw({ tableName: 'users', name: 'email' }),
      createRaw({ tableName: 'posts', name: 'id' }),
    ];

    const connector = buildConnector(rows);
    const schema = await connector.getSchemaInformation({});

    expect(schema.tables).toHaveLength(2);
    const users = schema.tables.find((t) => t.name === 'users');
    const posts = schema.tables.find((t) => t.name === 'posts');

    expect(users?.columns).toHaveLength(2);
    expect(posts?.columns).toHaveLength(1);
    expect(connector.mockClient.query).toHaveBeenCalled();
  });

  it('applies include regex filtering', async () => {
    const rows = [
      createRaw({ tableName: 'users' }),
      createRaw({ tableName: 'posts' }),
    ];
    const connector = buildConnector(rows);
    const schema = await connector.getSchemaInformation({
      include: '^use',
    });

    expect(schema.tables.map((t) => t.name)).toEqual(['users']);
  });

  it('applies include array filtering', async () => {
    const rows = [
      createRaw({ tableName: 'users' }),
      createRaw({ tableName: 'posts' }),
      createRaw({ tableName: 'comments' }),
    ];
    const connector = buildConnector(rows);
    const schema = await connector.getSchemaInformation({
      include: ['users', 'comments'],
    });

    expect(schema.tables.map((t) => t.name).sort()).toEqual([
      'comments',
      'users',
    ]);
  });

  it('applies exclude regex filtering', async () => {
    const rows = [
      createRaw({ tableName: 'users' }),
      createRaw({ tableName: 'posts' }),
    ];
    const connector = buildConnector(rows);
    const schema = await connector.getSchemaInformation({
      exclude: 'user',
    });

    expect(schema.tables.map((t) => t.name)).toEqual(['posts']);
  });

  it('applies combined include then exclude', async () => {
    const rows = [
      createRaw({ tableName: 'user_profiles' }),
      createRaw({ tableName: 'user_settings' }),
      createRaw({ tableName: 'posts' }),
    ];
    const connector = buildConnector(rows);
    const schema = await connector.getSchemaInformation({
      include: '^user_',
      exclude: 'settings',
    });

    expect(schema.tables.map((t) => t.name)).toEqual(['user_profiles']);
  });

  it('applies onColumnModelCreated hook (async) before grouping', async () => {
    const rows = [createRaw({ name: 'id' })];
    const connector = buildConnector(rows);
    const schema = await connector.getSchemaInformation({
      onColumnModelCreated: async (c) => ({
        ...c,
        type: 'int',
      }),
    });
    expect(schema.tables[0].columns[0].type).toBe('int');
  });

  it('applies onTableModelCreated hook (async) after grouping', async () => {
    const rows = [createRaw({ tableName: 'users' })];
    const connector = buildConnector(rows);
    const schema = await connector.getSchemaInformation({
      onTableModelCreated: async (t) => ({
        ...t,
        name: `${t.name}_x`,
      }),
    });
    expect(schema.tables[0].name).toBe('users_x');
  });

  it('returns empty tables list when no columns', async () => {
    const connector = buildConnector([]);
    const schema = await connector.getSchemaInformation({});
    expect(schema.tables).toEqual([]);
  });

  it('ensures maxLen undefined normalization', async () => {
    const connector = buildConnector([createRaw({ maxLen: undefined })]);
    const schema = await connector.getSchemaInformation({});
    expect(schema.tables[0].columns[0].maxLen).toBeUndefined();
  });
});
