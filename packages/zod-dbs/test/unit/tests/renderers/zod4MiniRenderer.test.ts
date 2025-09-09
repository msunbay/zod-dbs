import { describe, expect, it } from 'vitest';

import type { ZodDbsColumn, ZodDbsConfig, ZodDbsTable } from 'zod-dbs-core';

import { Zod4MiniRenderer } from '../../../../src/renderers/Zod4MiniRenderer.js';

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
  defaultEmptyArray: true,
  stringifyDates: true,
  stringifyJson: true,
  singularization: true,
  coerceDates: true,
  nullsToUndefined: true,
  caseTransform: true,
};

describe('Zod4MiniRenderer', () => {
  it('imports from zod/mini and overrides types', async () => {
    const tbl = table([
      column({ name: 'email', zodType: 'email' }),
      column({ name: 'guid', zodType: 'uuid' }),
      column({ name: 'payload', zodType: 'json', dataType: 'jsonb' }),
    ]);
    const out = await new Zod4MiniRenderer().renderSchemaFile(tbl, config);
    expect(out).toContain("import { z } from 'zod/mini'");
    expect(out).toContain('email: z.email()');
    expect(out).toContain('guid: z.uuid()');
    expect(out).toContain('payload: z.json()');
  });

  it('applies pipe-based optional/nullable/default transforms for array', async () => {
    const tbl = table([
      column({
        name: 'tags',
        zodType: 'string',
        isArray: true,
        isNullable: true,
        isReadOptional: true,
      }),
    ]);
    const out = await new Zod4MiniRenderer().renderSchemaFile(tbl, config);
    expect(out).toMatch(
      /tags: z\.pipe\(z\.optional\(z\.nullable\(z\.array\(z\.string\(\)\)\)\), z\.transform\(val => val \?\? \[\]\)\)/
    );
  });

  it('renders date arrays with stringifyDates true (non-nullable & nullable)', async () => {
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
    const out = await new Zod4MiniRenderer().renderSchemaFile(tbl, config);
    // Read schema (coerce date arrays, nullable variant uses pipe(optional(nullable(array(coerce.date)))) with fallback [] )
    expect(out).toMatch(/dates: z\.array\(z\.coerce\.date\(\)\)/);
    expect(out).toMatch(
      /dates_nullable: z\.pipe\(z\.optional\(z\.nullable\(z\.array\(z\.coerce\.date\(\)\)\)\), z\.transform\(val => val \?\? \[\]\)\)/
    );
    // Write schema (pipe with z.date(), transform to ISO strings)
    expect(out).toMatch(
      /dates: z\.pipe\(z\.array\(z\.date\(\)\), z\.transform\(\(value\) => value\.map\(date => date\.toISOString\(\)\)\)\)/
    );
    expect(out).toMatch(
      /datesNullable: z\.pipe\(z\.optional\(z\.nullable\(z\.array\(z\.date\(\)\)\)\), z\.transform\(\(value\) => value \? value\.map\(date => date\.toISOString\(\)\) : value\)\)/
    );
  });

  it('applies all writeTransforms via .check wrappers', async () => {
    const tbl = table([column({ name: 'val', zodType: 'string' })]);
    const out = await new Zod4MiniRenderer({
      onColumnModelCreated: (m) => ({
        ...m,
        writeTransforms: ['trim', 'lowercase', 'uppercase', 'normalize'] as any,
      }),
    }).renderSchemaFile(tbl, config);
    expect(out).toMatch(
      /val: z\.string\(\)(?:\.check\(z\.(?:trim|lowercase|uppercase|normalize)\(\)\)){4}/
    );
  });

  it('handles optional only (not nullable) field ordering', async () => {
    const tbl = table([
      column({
        name: 'nickname',
        zodType: 'string',
        isReadOptional: true,
        isNullable: false,
      }),
    ]);
    const out = await new Zod4MiniRenderer().renderSchemaFile(tbl, config);
    // optional wraps the base type first, transform added after pipe
    expect(out).toMatch(
      /nickname: z\.pipe\(z\.optional\(z\.string\(\)\), z\.transform\(val => val \?\? undefined\)\)/
    );
  });

  it('does not include json import section when location provided but no json columns', async () => {
    const tbl = table([column({ name: 'username', zodType: 'string' })]);
    const out = await new Zod4MiniRenderer().renderSchemaFile(tbl, {
      ...config,
      jsonSchemaImportLocation: '@schemas',
    });
    expect(out).not.toMatch(/from '@schemas'/);
  });

  it('does not stringify nullable json when stringifyJson is false', async () => {
    const tbl = table([
      column({
        name: 'meta',
        zodType: 'json',
        dataType: 'jsonb',
        isNullable: true,
      }),
    ]);
    const out = await new Zod4MiniRenderer().renderSchemaFile(tbl, {
      ...config,
      stringifyJson: false,
    });
    expect(out).not.toMatch(/JSON\.stringify/);
  });

  it('write transforms use .check wrappers & min/max', async () => {
    const tbl = table([
      column({ name: 'username', zodType: 'string', minLen: 2, maxLen: 20 }),
    ]);
    const out = await new Zod4MiniRenderer({
      onColumnModelCreated: (m) => ({
        ...m,
        writeTransforms: ['trim', 'lowercase'] as any,
      }),
    }).renderSchemaFile(tbl, config);
    expect(out).toMatch(
      /username: z\.string\(\)\.check\(z\.trim\(\)\)\.check\(z\.lowercase\(\)\)\.check\(z\.minLength\(2\)\)\.check\(z\.maxLength\(20\)\)/
    );
  });

  it('stringifies json in write schema when enabled', async () => {
    const tbl = table([
      column({ name: 'payload', zodType: 'json', dataType: 'jsonb' }),
    ]);
    const out = await new Zod4MiniRenderer().renderSchemaFile(tbl, config);
    expect(out).toMatch(
      /payload: z\.pipe\(z\.json\(\), z\.transform\(\(value\) => JSON\.stringify\(value\)\)\)/
    );
  });

  it('falls back to simple template when transformCasing is false', async () => {
    const tbl = table([
      column({ name: 'id', zodType: 'int', dataType: 'int4' }),
    ]);
    const out = await new Zod4MiniRenderer().renderSchemaFile(tbl, {
      ...config,
      caseTransform: false,
    });
    expect(out).toContain("import { z } from 'zod/mini'");
    expect(out).not.toContain('Base read schema');
  });

  it('ignores writeTransforms & min/max for enum columns', async () => {
    const tbl = table([
      column({
        name: 'status',
        zodType: 'string',
        isEnum: true,
        enumValues: ['active', 'inactive'],
        minLen: 2,
        maxLen: 10,
      }),
    ]);
    const out = await new Zod4MiniRenderer({
      onColumnModelCreated: (m) => ({
        ...m,
        writeTransforms: ['trim', 'lowercase'] as any,
      }),
    }).renderSchemaFile(tbl, config);
    const line = out.split('\n').find((l) => /status: z\.enum/.test(l)) || '';
    expect(line).toMatch(/status: z\.enum/);
    expect(line).not.toMatch(/trim|lowercase|minLength|maxLength/);
  });

  it('applies min/max & nonnegative constraints to number field', async () => {
    const tbl = table([
      column({
        name: 'score',
        zodType: 'number',
        dataType: 'int4',
        minLen: 1,
        maxLen: 10,
        writeTransforms: ['nonnegative'] as any,
      }),
    ]);
    const out = await new Zod4MiniRenderer().renderSchemaFile(tbl, config);
    expect(out).toMatch(
      /score: z\.number\(\)\.check\(z\.nonnegative\(\)\)\.check\(z\.minimum\(1\)\)\.check\(z\.maximum\(10\)\)/
    );
  });

  it('nullable-only (not optional) read field uses undefined fallback pipe', async () => {
    const tbl = table([
      column({ name: 'note', zodType: 'string', isNullable: true }),
    ]);
    const out = await new Zod4MiniRenderer().renderSchemaFile(tbl, config);
    const line = out.split('\n').find((l) => /note: /.test(l)) || '';
    expect(line).toMatch(/z\.nullable\(z\.string\(\)\)/);
    expect(line).toMatch(/z\.pipe\(z\.nullable/);
    expect(line).toMatch(/val => val \?\? undefined/);
    expect(line).not.toMatch(/z\.optional/);
  });

  it('optional-only array (non-nullable) uses defaultEmptyArray transform', async () => {
    const tbl = table([
      column({
        name: 'labels',
        zodType: 'string',
        isArray: true,
        isReadOptional: true,
      }),
    ]);
    const out = await new Zod4MiniRenderer().renderSchemaFile(tbl, config);
    expect(out).toMatch(
      /labels: z\.pipe\(z\.optional\(z\.array\(z\.string\(\)\)\), z\.transform\(val => val \?\? \[\]\)\)/
    );
  });

  it('nullable array with defaultEmptyArray false uses undefined fallback', async () => {
    const tbl = table([
      column({
        name: 'opts',
        zodType: 'string',
        isArray: true,
        isNullable: true,
        isReadOptional: true,
      }),
    ]);
    const out = await new Zod4MiniRenderer().renderSchemaFile(tbl, {
      ...config,
      defaultEmptyArray: false,
    });
    expect(out).toMatch(
      /opts: z\.pipe\(z\.optional\(z\.nullable\(z\.array\(z\.string\(\)\)\)\), z\.transform\(val => val \?\? undefined\)\)/
    );
    expect(out).not.toMatch(/\?\? \[\]/);
  });

  it('creates json schema imports and uses schema names for json fields', async () => {
    const tbl = table([
      column({ name: 'profile', zodType: 'json', dataType: 'jsonb' }),
      column({
        name: 'meta',
        zodType: 'json',
        dataType: 'json',
        isNullable: true,
        isReadOptional: true,
      }),
    ]);
    const out = await new Zod4MiniRenderer().renderSchemaFile(tbl, {
      ...config,
      jsonSchemaImportLocation: '@schemas',
    });
    expect(out).toMatch(
      /import { UserProfileSchema, UserMetaSchema } from '@schemas'/
    );
    expect(out).toContain('profile: UserProfileSchema');
    expect(out).toMatch(
      /meta: z\.pipe\(z\.optional\(z\.nullable\(UserMetaSchema\)\), z\.transform\(val => val \?\? undefined\)\)/
    );
  });

  it('stringifies nullable json in write schema when enabled', async () => {
    const tbl = table([
      column({
        name: 'meta',
        zodType: 'json',
        dataType: 'jsonb',
        isNullable: true,
        isReadOptional: true,
        isWriteOptional: true,
      }),
    ]);
    const out = await new Zod4MiniRenderer().renderSchemaFile(tbl, config);
    expect(out).toMatch(
      /meta: z\.pipe\(z\.optional\(z\.nullable\(z\.json\(\)\)\), z\.transform\(val => val \?\? undefined\)\)/
    ); // read path
    expect(out).toMatch(
      /meta: z\.pipe\(z\.optional\(z\.nullable\(z\.json\(\)\)\), z\.transform\(\(value\) => value \? JSON\.stringify\(value\) : value\)\)/
    ); // write path
  });

  it('stringifies single date fields (nullable and non-nullable)', async () => {
    const tbl = table([
      column({ name: 'created_at', zodType: 'date', dataType: 'timestamptz' }),
      column({
        name: 'updated_at',
        zodType: 'date',
        dataType: 'timestamptz',
        isNullable: true,
        isWriteOptional: true,
      }),
    ]);
    const out = await new Zod4MiniRenderer().renderSchemaFile(tbl, config);
    expect(out).toMatch(
      /createdAt: z\.pipe\(z\.date\(\), z\.transform\(\(value\) => value\.toISOString\(\)\)\)/
    );
    expect(out).toMatch(
      /updatedAt: z\.pipe\(z\.optional\(z\.nullable\(z\.date\(\)\)\), z\.transform\(\(value\) => value \? value\.toISOString\(\) : value\)\)/
    );
  });

  it('does not stringify date fields when stringifyDates is false', async () => {
    const tbl = table([
      column({ name: 'created_at', zodType: 'date', dataType: 'timestamptz' }),
    ]);
    const out = await new Zod4MiniRenderer().renderSchemaFile(tbl, {
      ...config,
      stringifyDates: false,
    });
    const line = out.split('\n').find((l) => /createdAt: /.test(l)) || '';
    expect(line).not.toMatch(/toISOString/);
  });

  it('does not stringify non-nullable json when stringifyJson is false', async () => {
    const tbl = table([
      column({ name: 'payload', zodType: 'json', dataType: 'jsonb' }),
    ]);
    const out = await new Zod4MiniRenderer().renderSchemaFile(tbl, {
      ...config,
      stringifyJson: false,
    });
    expect(out).not.toMatch(/JSON\.stringify\(value\)/);
  });

  it('ignores writeTransforms on non-string base types (date, json, boolean)', async () => {
    const tbl = table([
      column({ name: 'created_at', zodType: 'date', dataType: 'timestamptz' }),
      column({ name: 'settings', zodType: 'json', dataType: 'jsonb' }),
      column({ name: 'is_active', zodType: 'boolean', dataType: 'bool' }),
    ]);
    const out = await new Zod4MiniRenderer({
      onColumnModelCreated: (m) => ({
        ...m,
        writeTransforms: ['trim', 'lowercase', 'uppercase', 'normalize'] as any,
      }),
    }).renderSchemaFile(tbl, config);
    const section = out
      .split('\n')
      .filter((l) => /createdAt:|settings:|is_active:/.test(l))
      .join('\n');
    expect(section).not.toMatch(
      /\.check\(z\.(trim|lowercase|uppercase|normalize)\(\)\)/
    );
  });

  it('handles empty writeTransforms array (no .check chains)', async () => {
    const tbl = table([column({ name: 'title', zodType: 'string' })]);
    const out = await new Zod4MiniRenderer({
      onColumnModelCreated: (m) => ({ ...m, writeTransforms: [] }),
    }).renderSchemaFile(tbl, config);
    const line = out.split('\n').find((l) => /title: z\.string/.test(l)) || '';
    expect(line).toMatch(/title: z\.string\(\)(?!\.check)/);
  });
});
