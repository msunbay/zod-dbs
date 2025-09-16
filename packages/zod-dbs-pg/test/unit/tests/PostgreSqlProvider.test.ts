import { createClient } from '../../../src/client.js';
import { PostgreSqlProvider } from '../../../src/PostgreSqlProvider.js';

vi.mock('../../../src/client', () => ({
  createClient: vi.fn(),
}));

describe('PostgreSqlProvider', () => {
  let provider: PostgreSqlProvider;
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockClient = {
      connect: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue([]),
      end: vi.fn().mockResolvedValue(undefined),
    };

    (createClient as any).mockReturnValue(mockClient);
  });

  it('should call onProgress and client methods in the correct order', async () => {
    const onProgress = vi.fn();
    const config = {
      host: 'localhost',
      port: 5432,
      database: 'test',
      user: 'test',
      password: 'password',
      onProgress,
    };

    provider = new PostgreSqlProvider();

    await provider.getSchemaInformation(config);

    expect(onProgress).toHaveBeenNthCalledWith(1, 'connecting');
    expect(onProgress).toHaveBeenNthCalledWith(2, 'fetchingSchema');

    expect(createClient).toHaveBeenCalledWith({
      ...config,
      schemaName: 'public',
    });
    expect(mockClient.connect).toHaveBeenCalledBefore(mockClient.query);
    expect(mockClient.query).toHaveBeenCalledBefore(mockClient.end);
    expect(mockClient.end).toHaveBeenCalled();
  });

  it('should retrieve schema information and call the client with the correct query', async () => {
    const mockData = [
      {
        tableName: 'users',
        name: 'id',
        defaultValue: "nextval('users_id_seq'::regclass)",
        dataType: 'int4',
        isNullable: false,
        maxLen: undefined,
        description: undefined,
        tableType: 'table',
        schemaName: '',
      },
    ];

    mockClient.query.mockResolvedValue(mockData);

    const config = {
      host: 'localhost',
      port: 5432,
      database: 'test',
      user: 'test',
      password: 'password',
      schemaName: 'custom_schema',
    };

    provider = new PostgreSqlProvider();

    const result = await provider.getSchemaInformation(config);

    expect(mockClient.query).toHaveBeenCalledWith(expect.any(String), [
      'custom_schema',
    ]);

    expect(result).toMatchInlineSnapshot(`
      {
        "tables": [
          {
            "columns": [
              {
                "dataType": "int4",
                "defaultValue": "nextval('users_id_seq'::regclass)",
                "description": undefined,
                "isArray": false,
                "isEnum": false,
                "isNullable": false,
                "isReadOptional": false,
                "isSerial": true,
                "isWritable": false,
                "isWriteOptional": true,
                "maxLen": undefined,
                "name": "id",
                "schemaName": "custom_schema",
                "tableName": "users",
                "tableType": "table",
                "zodType": "int",
              },
            ],
            "name": "users",
            "schemaName": "custom_schema",
            "type": "table",
          },
        ],
      }
    `);
  });

  it('should handle errors and ensure client.end is called', async () => {
    const error = new Error('Test query error');
    mockClient.query.mockRejectedValue(error);

    const config = {
      host: 'localhost',
      port: 5432,
      database: 'test',
      user: 'test',
      password: 'password',
    };

    provider = new PostgreSqlProvider();

    await expect(provider.getSchemaInformation(config)).rejects.toThrow(error);

    expect(mockClient.end).toHaveBeenCalled();
  });
});
