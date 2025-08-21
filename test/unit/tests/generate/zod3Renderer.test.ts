import { describe, expect, it } from 'vitest';

import type {
  ZodDbsColumnInfo,
  ZodDbsConfig,
  ZodDbsTableInfo,
} from '../../../../src/types.js';

import { Zod3Renderer } from '../../../../src/generate/renderers/Zod3Renderer.js';

const column = (overrides: Partial<ZodDbsColumnInfo>): ZodDbsColumnInfo => ({
  name: 'col',
  dataType: 'text',
  type: 'string',
  isEnum: false,
  isSerial: false,
  isArray: false,
  isNullable: false,
  isWritable: true,
  tableName: 'users',
  schemaName: 'public',
  tableType: 'table',
  ...overrides,
});
const table = (cols: ZodDbsColumnInfo[]): ZodDbsTableInfo => ({
  type: 'table',
  name: 'users',
  schemaName: 'public',
  columns: cols,
});
const config: ZodDbsConfig = {
  outputDir: '/tmp/ignore',
  fieldNameCasing: 'camelCase',
  objectNameCasing: 'PascalCase',
  stringifyJson: true,
  singularize: true,
  coerceDates: true,
  defaultNullsToUndefined: true,
  caseTransform: true,
};

describe('Zod3Renderer', () => {
  it('overrides email/url/int/uuid types with zod 3 style chains', async () => {
    const tbl = table([
      column({ name: 'email', type: 'email' }),
      column({ name: 'homepage', type: 'url' }),
      column({ name: 'age', type: 'int' }),
      column({ name: 'guid', type: 'uuid' }),
    ]);
    const out = await new Zod3Renderer().renderSchema(tbl, config);
    expect(out).toContain('email: z.string().email()');
    expect(out).toContain('homepage: z.string().url()');
    expect(out).toContain('age: z.number().int()');
    expect(out).toContain('guid: z.string().uuid()');
  });

  it('leaves json type as z.any()', async () => {
    const tbl = table([
      column({ name: 'payload', type: 'json', dataType: 'jsonb' }),
    ]);
    const out = await new Zod3Renderer().renderSchema(tbl, config);
    expect(out).toContain('payload: z.any()');
  });

  it('renders date arrays with stringifyDates (non-nullable & nullable)', async () => {
    const tbl = table([
      column({
        name: 'dates',
        type: 'date',
        dataType: 'timestamptz',
        isArray: true,
      }),
      column({
        name: 'dates_nullable',
        type: 'date',
        dataType: 'timestamptz',
        isArray: true,
        isNullable: true,
        isOptional: true,
      }),
    ]);
    const out = await new Zod3Renderer().renderSchema(tbl, {
      ...config,
      stringifyDates: true,
    });
    expect(out).toMatch(/dates: z\.array\(z\.coerce\.date\(\)\)/);
    expect(out).toMatch(
      /dates_nullable: z\.array\(z\.coerce\.date\(\)\)\.nullable\(\)\.transform\(\(value\) => value \?\? undefined\)\.optional\(\)/
    );
    expect(out).toMatch(
      /dates: z\.array\(z\.date\(\)\)\.transform\(\(value\) => value\.map\(date => date\.toISOString\(\)\)\)/
    );
    expect(out).toMatch(
      /datesNullable: z\.array\(z\.date\(\)\)\.nullable\(\)\.transform\(\(value\) => value \? value\.map\(date => date\.toISOString\(\)\) : value\)\.optional\(\)/
    );
  });

  it('handles optional only (not nullable) field with proper transform', async () => {
    const tbl = table([
      column({
        name: 'nickname',
        type: 'string',
        isOptional: true,
        isNullable: false,
      }),
    ]);
    const out = await new Zod3Renderer().renderSchema(tbl, config);
    expect(out).toMatch(
      /nickname: z\.string\(\)\.transform\(\(value\) => value \?\? undefined\)\.optional\(\)/
    );
  });
});
