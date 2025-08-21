import { beforeEach, describe, expect, it, vi } from 'vitest';

import type {
  ZodDbsColumnInfo,
  ZodDbsRawColumnInfo,
  ZodDbsTableInfo,
  ZodDbsTableType,
} from '../../../../src/types.js';

import { getEnumConstraints } from '../../../../src/database/enumConstraints.js';
import { PostgreSqlConnector } from '../../../../src/database/PostgreSqlConnector.js';
import {
  getZodType,
  isArrayType,
  isSerialType,
} from '../../../../src/database/typeMap.js';

// Mocks
vi.mock('../../../../src/utils/debug.js', () => ({
  logDebug: vi.fn(),
}));

vi.mock('../../../../src/utils/sql.js', () => ({
  sql: (strings: TemplateStringsArray, ...values: any[]) => {
    // simple passthrough producing deterministic string for assertion if needed
    let result = strings[0];
    for (let i = 0; i < values.length; i++)
      result += `$${i + 1}${strings[i + 1]}`;
    return result;
  },
}));

vi.mock('../../../../src/database/enumConstraints.js', () => ({
  getEnumConstraints: vi.fn(),
}));

vi.mock('../../../../src/database/typeMap.js', () => ({
  getZodType: vi.fn(),
  isArrayType: vi.fn(),
  isSerialType: vi.fn(),
}));

vi.mock('../../../../src/database/client.js', () => ({
  createConnectionString: vi
    .fn()
    .mockReturnValue('postgres://user:pass@host:5432/db'),
}));

// Helpers
const createRaw = (
  overrides: Partial<ZodDbsRawColumnInfo> = {}
): ZodDbsRawColumnInfo => ({
  tableName: 'users',
  name: 'id',
  defaultValue: undefined,
  dataType: 'int4',
  isNullable: false,
  maxLen: undefined,
  description: undefined,
  checkConstraints: undefined,
  tableType: 'table' as ZodDbsTableType,
  schemaName: 'public',
  ...overrides,
});

interface MockClient {
  query: ReturnType<typeof vi.fn>;
  end: ReturnType<typeof vi.fn>;
}

const buildConnector = (rows: ZodDbsRawColumnInfo[], options: any = {}) => {
  const connector = new PostgreSqlConnector(options) as PostgreSqlConnector & {
    __mockClient?: MockClient;
  };
  const mockClient: MockClient = {
    connect: vi.fn().mockResolvedValue(undefined),
    query: vi.fn().mockResolvedValue({ rows }),
    end: vi.fn().mockResolvedValue(undefined),
  } as any;
  (connector as any).createClient = () => mockClient; // monkeypatch protected property function
  connector.__mockClient = mockClient;
  return connector;
};

describe('PostgreSqlConnector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getEnumConstraints).mockReturnValue([]);
    vi.mocked(getZodType).mockReturnValue('string');
    vi.mocked(isArrayType).mockReturnValue(false);
    vi.mocked(isSerialType).mockReturnValue(false);
  });

  it('retrieves and groups columns into tables', async () => {
    const rows = [
      createRaw({ tableName: 'users', name: 'id' }),
      createRaw({ tableName: 'users', name: 'email' }),
      createRaw({ tableName: 'posts', name: 'id' }),
    ];

    const connector = buildConnector(rows);
    const schema = await connector.getSchemaInformation({
      outputDir: '/tmp/ignore',
    });

    expect(schema.tables).toHaveLength(2);
    const users = schema.tables.find((t) => t.name === 'users');
    const posts = schema.tables.find((t) => t.name === 'posts');

    expect(users?.columns).toHaveLength(2);
    expect(posts?.columns).toHaveLength(1);
    expect(connector.__mockClient?.query).toHaveBeenCalled();
    expect(connector.__mockClient?.end).toHaveBeenCalled();
  });

  it('applies include regex filtering', async () => {
    const rows = [
      createRaw({ tableName: 'users' }),
      createRaw({ tableName: 'posts' }),
    ];
    const connector = buildConnector(rows);
    const schema = await connector.getSchemaInformation({
      include: '^use',
      outputDir: '/tmp/ignore',
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
      outputDir: '/tmp/ignore',
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
      outputDir: '/tmp/ignore',
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
      outputDir: '/tmp/ignore',
    });

    expect(schema.tables.map((t) => t.name)).toEqual(['user_profiles']);
  });

  it('extracts enum constraints & sets isEnum', async () => {
    vi.mocked(getEnumConstraints).mockReturnValue(['active', 'inactive']);

    const rows = [
      createRaw({
        tableName: 'users',
        name: 'status',
        checkConstraints: [{ checkClause: "status IN ('active','inactive')" }],
      }),
    ];
    const connector = buildConnector(rows);
    const schema = await connector.getSchemaInformation({
      outputDir: '/tmp/ignore',
    });

    const col = schema.tables[0].columns[0];
    expect(col.enumValues).toEqual(['active', 'inactive']);
    expect(col.isEnum).toBe(true);
    expect(getEnumConstraints).toHaveBeenCalled();
  });

  it('applies onColumnModelCreated hook (async) before grouping', async () => {
    const rows = [createRaw({ name: 'id' })];
    const connector = buildConnector(rows, {
      onColumnModelCreated: async (c: ZodDbsColumnInfo) => ({
        ...c,
        type: 'int',
      }),
    });
    const schema = await connector.getSchemaInformation({
      outputDir: '/tmp/ignore',
    });
    expect(schema.tables[0].columns[0].type).toBe('int');
  });

  it('applies onTableModelCreated hook (async) after grouping', async () => {
    const rows = [createRaw({ tableName: 'users' })];
    const connector = buildConnector(rows, {
      onTableModelCreated: async (t: ZodDbsTableInfo) => ({
        ...t,
        name: `${t.name}_x`,
      }),
    });
    const schema = await connector.getSchemaInformation({
      outputDir: '/tmp/ignore',
    });
    expect(schema.tables[0].name).toBe('users_x');
  });

  it('sets type/array/serial flags using typeMap helpers', async () => {
    vi.mocked(getZodType).mockReturnValue('int');
    vi.mocked(isArrayType).mockReturnValue(true);
    vi.mocked(isSerialType).mockReturnValue(true);

    const rows = [createRaw({ name: 'vals', dataType: '_int4' })];
    const connector = buildConnector(rows);
    const schema = await connector.getSchemaInformation({
      outputDir: '/tmp/ignore',
    });
    const col = schema.tables[0].columns[0];
    expect(col.type).toBe('int');
    expect(col.isArray).toBe(true);
    expect(col.isSerial).toBe(true);
  });

  it('returns empty tables list when no columns', async () => {
    const connector = buildConnector([]);
    const schema = await connector.getSchemaInformation({
      outputDir: '/tmp/ignore',
    });
    expect(schema.tables).toEqual([]);
  });

  it('ensures maxLen undefined normalization', async () => {
    const connector = buildConnector([createRaw({ maxLen: undefined })]);
    const schema = await connector.getSchemaInformation({
      outputDir: '/tmp/ignore',
    });
    expect(schema.tables[0].columns[0].maxLen).toBeUndefined();
  });
});
