import {
  DescribeTableCommand,
  ListTablesCommand,
  ScanCommand,
} from '@aws-sdk/client-dynamodb';
import { logDebug, ZodDbsBaseProvider } from 'zod-dbs-core';

import type {
  ZodDbsColumnInfo,
  ZodDbsProvider,
  ZodDbsProviderConfig,
} from 'zod-dbs-core';

import { createClient } from './client.js';
import { logEntriesToFile } from './debug.js';

export class DynamoDbProvider
  extends ZodDbsBaseProvider
  implements ZodDbsProvider
{
  constructor() {
    super({
      name: 'dynamo',
      displayName: 'DynamoDB',
      configurationDefaults: {
        region: 'us-east-1',
        sampleSize: 50,
        nullsToUndefined: false,
        stringifyJson: false,
      },
      options: [
        {
          name: 'region',
          type: 'string',
          description: 'AWS region for DynamoDB',
        },
        {
          name: 'access-key-id',
          type: 'string',
          description: 'AWS Access Key ID (for local or custom endpoints)',
        },
        {
          name: 'secret-access-key',
          type: 'string',
          description: 'AWS Secret Access Key (for local or custom endpoints)',
        },
        {
          name: 'session-token',
          type: 'string',
          description: 'AWS Session Token (for local or custom endpoints)',
        },
        {
          name: 'endpoint',
          type: 'string',
          description: 'Override endpoint (e.g., for local DynamoDB)',
        },
        {
          name: 'sample-size',
          type: 'number',
          description:
            'Number of items to sample per table when inferring schema',
        },
      ],
    });
  }

  protected async createClient(options: ZodDbsProviderConfig) {
    return await createClient(options);
  }

  protected createColumnInfo(args: {
    tableName: string;
    name: string;
    dynamoType: string;
    isNullable: boolean;
  }): ZodDbsColumnInfo {
    const { tableName, name, dynamoType, isNullable } = args;

    return {
      name,
      defaultValue: undefined,
      isNullable,
      maxLen: undefined,
      minLen: undefined,
      dataType: dynamoType,
      tableName,
      schemaName: undefined,
      description: undefined,
      tableType: 'table',
      enumValues: undefined,
      isEnum: false,
      isSerial: false,
      isArray: false,
    };
  }

  /**
   * Basic inference rules mapping DynamoDB AttributeValue types to simplified types.
   */
  private inferTypeFromAttribute(value: any): {
    type: string;
    isNullable: boolean;
  } {
    if (value === null || value === undefined)
      return { type: 'any', isNullable: true };

    if (value.S !== undefined) return { type: 'string', isNullable: false };
    if (value.N !== undefined) return { type: 'number', isNullable: false };
    if (value.BOOL !== undefined) return { type: 'boolean', isNullable: false };
    if (value.M !== undefined) return { type: 'object', isNullable: false };
    if (value.L !== undefined) return { type: 'array', isNullable: false };
    if (value.B !== undefined) return { type: 'string', isNullable: false }; // treat binary as base64 string
    if (value.SS !== undefined) return { type: 'array', isNullable: false };
    if (value.NS !== undefined) return { type: 'array', isNullable: false };
    if (value.BS !== undefined) return { type: 'array', isNullable: false };

    return { type: 'any', isNullable: true };
  }

  public async fetchSchemaInfo(
    config: ZodDbsProviderConfig
  ): Promise<ZodDbsColumnInfo[]> {
    config.onProgress?.('Connecting to DynamoDB');
    const client = await this.createClient(config);
    await client.connect();

    try {
      const driver = client.driver;

      config.onProgress?.('Retrieving table list');
      const listTablesResp = await driver.send(new ListTablesCommand({}));
      const tableNames: string[] = listTablesResp?.TableNames || [];
      logDebug(`Retrieving DynamoDB tables`, { count: tableNames.length });

      const columns: ZodDbsColumnInfo[] = [];
      const sampleSize = config.sampleSize ?? 50;

      // For each table, describe and scan a few items
      for (const tableName of tableNames) {
        // Describe table
        let keyAttributes: string[] = [];
        try {
          config.onProgress?.(`Scanning table ${tableName}`);
          const descResp = await driver.send(
            new DescribeTableCommand({ TableName: tableName })
          );
          keyAttributes = (descResp.Table?.KeySchema || []).map(
            (k: any) => k.AttributeName
          );

          // Scan items to infer other attributes
          const scanResp = await driver.send(
            new ScanCommand({ TableName: tableName, Limit: sampleSize })
          );

          const attributeStats = new Map<
            string,
            { types: Set<string>; nulls: number; seen: number }
          >();

          for (const item of scanResp.Items || []) {
            for (const [attr, val] of Object.entries<any>(item)) {
              const stat = attributeStats.get(attr) || {
                types: new Set<string>(),
                nulls: 0,
                seen: 0,
              };
              stat.seen++;
              const inferred = this.inferTypeFromAttribute(val);
              stat.types.add(inferred.type);
              if (inferred.isNullable) stat.nulls++;
              attributeStats.set(attr, stat);
            }
          }

          for (const [attr, stat] of attributeStats.entries()) {
            let dataType: string;
            if (stat.types.size === 1) dataType = [...stat.types][0];
            else if (stat.types.size === 0) dataType = 'any';
            else dataType = 'json';

            const isNullable = stat.nulls > 0 && stat.nulls < stat.seen;
            const colInfo = this.createColumnInfo({
              tableName,
              name: attr,
              dynamoType: dataType,
              isNullable: isNullable,
            });

            // Mark key attributes as non-nullable
            if (keyAttributes.includes(attr)) colInfo.isNullable = false;

            columns.push(colInfo);
          }

          if (config.debug) {
            await logEntriesToFile(tableName, scanResp.Items || []);
          }
        } catch (err) {
          logDebug(`Error processing table ${tableName}`, { err });
        }
      }

      return columns;
    } finally {
      await client.end();
    }
  }
}
