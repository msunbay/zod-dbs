import { describe, expect, it } from 'vitest';

import type { ZodDbsColumn, ZodDbsConfig, ZodDbsTable } from 'zod-dbs-core';

import { Zod3Renderer } from '../../../../src/renderers/Zod3Renderer.js';

const column = (overrides: Partial<ZodDbsColumn>): ZodDbsColumn => ({
  name: 'col',
  dataType: 'text',
  zodType: 'string',
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
  stringifyJson: true,
  singularization: true,
  coerceDates: true,
  defaultNullsToUndefined: true,
  caseTransform: true,
};

describe('Zod3Renderer', () => {
  it('overrides email/url/int/uuid types with zod 3 style chains', async () => {
    const tbl = table([
      column({ name: 'email', zodType: 'email' }),
      column({ name: 'homepage', zodType: 'url' }),
      column({ name: 'age', zodType: 'int' }),
      column({ name: 'guid', zodType: 'uuid' }),
    ]);
    const out = await new Zod3Renderer().renderSchemaFile(tbl, config);
    expect(out).toContain('email: z.string().email()');
    expect(out).toContain('homepage: z.string().url()');
    expect(out).toContain('age: z.number().int()');
    expect(out).toContain('guid: z.string().uuid()');
  });

  it('leaves json zodType as z.any()', async () => {
    const tbl = table([
      column({ name: 'payload', zodType: 'json', dataType: 'jsonb' }),
    ]);
    const out = await new Zod3Renderer().renderSchemaFile(tbl, config);
    expect(out).toContain('payload: z.any()');
  });

  it('renders date arrays with stringifyDates (non-nullable & nullable)', async () => {
    const tbl = table([
      column({
        name: 'dates',
        zodType: 'date',
        dataType: 'timestamptz',
        isArray: true,
      }),
      column({
        name: 'dates_nullable',
        zodType: 'date',
        dataType: 'timestamptz',
        isArray: true,
        isNullable: true,
        isReadOptional: true,
        isWriteOptional: true,
      }),
    ]);
    const out = await new Zod3Renderer().renderSchemaFile(tbl, {
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
        zodType: 'string',
        isReadOptional: true,
        isNullable: false,
      }),
    ]);
    const out = await new Zod3Renderer().renderSchemaFile(tbl, config);
    expect(out).toMatch(
      /nickname: z\.string\(\)\.transform\(\(value\) => value \?\? undefined\)\.optional\(\)/
    );
  });
});
