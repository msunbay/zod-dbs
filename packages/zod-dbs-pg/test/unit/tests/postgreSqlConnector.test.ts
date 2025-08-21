import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodDbsRawColumnInfo } from 'zod-dbs-core';

import { createClient } from '../../../src/client.js';
import { PostgreSqlConnector } from '../../../src/PostgreSqlConnector.js';

// Mock the client module
vi.mock('../../../src/client', () => ({
  createClient: vi.fn(),
}));

describe('PostgreSqlConnector', () => {
  let connector: PostgreSqlConnector;
  let mockClient: any;

  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Setup mock client
    mockClient = {
      connect: vi.fn().mockResolvedValue(undefined),
      query: vi.fn().mockResolvedValue({ rows: [] }),
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

    connector = new PostgreSqlConnector();

    await connector.getSchemaInformation(config);

    // Verify onProgress calls
    expect(onProgress).toHaveBeenNthCalledWith(1, 'connecting');
    expect(onProgress).toHaveBeenNthCalledWith(2, 'fetchingSchema');

    // Verify client method calls
    expect(createClient).toHaveBeenCalledWith(config);
    expect(mockClient.connect).toHaveBeenCalledBefore(mockClient.query);
    expect(mockClient.query).toHaveBeenCalledBefore(mockClient.end);
    expect(mockClient.end).toHaveBeenCalled();
  });

  it('should retrieve schema information and call the client with the correct query', async () => {
    const mockData: ZodDbsRawColumnInfo[] = [
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

    mockClient.query.mockResolvedValue({ rows: mockData });

    const config = {
      host: 'localhost',
      port: 5432,
      database: 'test',
      user: 'test',
      password: 'password',
      schemaName: 'custom_schema',
    };

    connector = new PostgreSqlConnector();

    const result = await connector.getSchemaInformation(config);

    expect(mockClient.query).toHaveBeenCalledWith(expect.any(String), [
      'custom_schema',
    ]);

    expect(result).toMatchInlineSnapshot(`
      {
        "name": "custom_schema",
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
                "isOptional": false,
                "isSerial": true,
                "isWritable": false,
                "maxLen": undefined,
                "name": "id",
                "schemaName": "custom_schema",
                "tableName": "users",
                "tableType": "table",
                "type": "int",
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

    connector = new PostgreSqlConnector();

    await expect(connector.getSchemaInformation(config)).rejects.toThrow(error);

    expect(mockClient.end).toHaveBeenCalled();
  });
});
