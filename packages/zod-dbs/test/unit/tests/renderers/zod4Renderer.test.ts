import { describe, expect, it } from 'vitest';
import { ZodDbsColumn, ZodDbsConfig, ZodDbsTable } from 'zod-dbs-core';

import { Zod4Renderer } from '../../../../src/renderers/Zod4Renderer.js';

const column = (overrides: Partial<ZodDbsColumn>): ZodDbsColumn => ({
  name: 'col',
  dataType: 'text',
  isEnum: false,
  isSerial: false,
  isArray: false,
  isNullable: false,
  isWritable: true,
  isReadOptional: false,
  isWriteOptional: false,
  tableName: 'users',
  schemaName: 'public',
  tableType: 'table',
  type: 'string',
  ...overrides,
});
const table = (cols: ZodDbsColumn[]): ZodDbsTable => ({
  type: 'table',
  name: 'users',
  schemaName: 'public',
  columns: cols,
});
const config: ZodDbsConfig = {
  outputDir: '/tmp/ignore',
  fieldNameCasing: 'camelCase',
  objectNameCasing: 'PascalCase',
  defaultNullsToUndefined: true,
  stringifyJson: true,
  singularization: true,
  coerceDates: true,
  caseTransform: true,
};

describe('Zod4Renderer', () => {
  it('overrides email/url/int/uuid/json types with zod 4 primitives', async () => {
    const tbl = table([
      column({ name: 'email', type: 'email' }),
      column({ name: 'homepage', type: 'url' }),
      column({ name: 'age', type: 'int' }),
      column({ name: 'guid', type: 'uuid' }),
      column({ name: 'payload', type: 'json', dataType: 'jsonb' }),
    ]);
    const out = await new Zod4Renderer().renderSchemaFile(tbl, config);
    expect(out).toContain('email: z.email()');
    expect(out).toContain('homepage: z.url()');
    expect(out).toContain('age: z.int()');
    expect(out).toContain('guid: z.uuid()');
    expect(out).toContain('payload: z.json()');
  });

  it('uses z.date when coerceDates is false', async () => {
    const tbl = table([
      column({ name: 'created_at', type: 'date', dataType: 'timestamptz' }),
    ]);
    const out = await new Zod4Renderer().renderSchemaFile(tbl, {
      ...config,
      coerceDates: false,
    });
    expect(out).toContain('created_at: z.date()');
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
        isReadOptional: true,
        isWriteOptional: true,
      }),
    ]);
    const out = await new Zod4Renderer().renderSchemaFile(tbl, {
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
        isReadOptional: true,
        isNullable: false,
      }),
    ]);
    const out = await new Zod4Renderer().renderSchemaFile(tbl, config);
    expect(out).toMatch(
      /nickname: z\.string\(\)\.transform\(\(value\) => value \?\? undefined\)\.optional\(\)/
    );
  });
});
