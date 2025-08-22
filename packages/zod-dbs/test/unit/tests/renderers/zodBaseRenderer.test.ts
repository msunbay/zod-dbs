import { describe, expect, it } from 'vitest';
import { ZodDbsColumn, ZodDbsConfig, ZodDbsTable } from 'zod-dbs-core';

import { ZodBaseRenderer } from '../../../../src/renderers/ZodBaseRenderer.js';

// Helpers
const column = (overrides: Partial<ZodDbsColumn>): ZodDbsColumn => ({
  name: 'col',
  dataType: 'text',
  type: 'string',
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

const baseConfig: ZodDbsConfig = {
  outputDir: '/tmp/ignore',
  fieldNameCasing: 'camelCase',
  objectNameCasing: 'PascalCase',
  defaultEmptyArray: true,
  stringifyDates: true,
  stringifyJson: true,
  singularization: true,
  coerceDates: true,
  defaultNullsToUndefined: true,
  caseTransform: true,
};

describe('ZodBaseRenderer', () => {
  it('renders fallback types number, unknown, any', async () => {
    const tbl = table([
      column({ name: 'total', type: 'number', dataType: 'numeric' }),
      column({ name: 'mystery', type: 'unknown', dataType: 'unknown' }),
      column({ name: 'whatever', type: 'any', dataType: 'other' }),
    ]);
    const out = await new ZodBaseRenderer().renderSchemaFile(tbl, baseConfig);
    expect(out).toContain('total: z.number()');
    expect(out).toContain('mystery: z.unknown()');
    expect(out).toContain('whatever: z.any()');
  });

  it('renders core zod types & array/nullable/optional transforms', async () => {
    const tbl = table([
      column({ name: 'id', type: 'int', dataType: 'int4', isSerial: true }),
      column({ name: 'email', type: 'email', dataType: 'varchar' }),
      column({
        name: 'profile',
        type: 'json',
        dataType: 'jsonb',
        isNullable: true,
        isReadOptional: true,
      }),
      column({ name: 'created_at', type: 'date', dataType: 'timestamptz' }),
      column({
        name: 'tags',
        type: 'string',
        dataType: '_text',
        isArray: true,
        isNullable: true,
        isReadOptional: true,
      }),
    ]);
    const out = await new ZodBaseRenderer().renderSchemaFile(tbl, baseConfig);
    expect(out).toContain('id: z.number()');
    expect(out).toContain('email: z.string()');
    expect(out).toContain(
      'profile: z.any().nullable().transform((value) => value ?? undefined).optional()'
    );
    expect(out).toContain('created_at: z.coerce.date()');
    expect(out).toMatch(
      /tags: z\.array\(z\.string\(\)\)\.nullable\(\)\.transform\(\(value\) => value \?\? \[\]\)\.optional\(\)/
    );
  });

  it('honors coerceDates set to false for date fields', async () => {
    const tbl = table([
      column({ name: 'created_at', type: 'date', dataType: 'timestamptz' }),
    ]);
    const out = await new ZodBaseRenderer().renderSchemaFile(tbl, {
      ...baseConfig,
      coerceDates: false,
    });
    expect(out).toContain('created_at: z.date()');
  });

  it('stringifies dates in write schema when stringifyDates is true', async () => {
    const tbl = table([
      column({ name: 'created_at', type: 'date', dataType: 'timestamptz' }),
    ]);
    const out = await new ZodBaseRenderer().renderSchemaFile(tbl, baseConfig);
    expect(out).toMatch(
      /createdAt: z\.date\(\)\.transform\(\(value\) => value\.toISOString\(\)\)/
    );
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
    const out = await new ZodBaseRenderer().renderSchemaFile(tbl, baseConfig);
    // Read base schema assertions (coerced dates)
    expect(out).toMatch(/dates: z\.array\(z\.coerce\.date\(\)\)/);
    expect(out).toMatch(
      /dates_nullable: z\.array\(z\.coerce\.date\(\)\)\.nullable\(\)\.transform\(\(value\) => value \?\? \[\]\)\.optional\(\)/
    );
    // Write base schema assertions (stringify logic on base write schema)
    expect(out).toMatch(
      /dates: z\.array\(z\.date\(\)\)\.transform\(\(value\) => value\.map\(date => date\.toISOString\(\)\)\)/
    );
    expect(out).toMatch(
      /datesNullable: z\.array\(z\.date\(\)\)\.nullable\(\)\.transform\(\(value\) => value \? value\.map\(date => date\.toISOString\(\)\) : value\)\.optional\(\)/
    );
  });

  it('applies min/max length constraints on write schema only', async () => {
    const tbl = table([
      column({ name: 'username', type: 'string', minLen: 2, maxLen: 10 }),
    ]);
    const out = await new ZodBaseRenderer().renderSchemaFile(tbl, baseConfig);
    expect(out).toMatch(/username: z\.string\(\)\.min\(2\)\.max\(10\)/);
  });

  it('omits length constraints for enums', async () => {
    const tbl = table([
      column({
        name: 'status',
        type: 'string',
        isEnum: true,
        enumValues: ['active', 'inactive'],
      }),
    ]);
    const out = await new ZodBaseRenderer().renderSchemaFile(tbl, baseConfig);
    // Constant name uses formatted enum constant name
    expect(out).toMatch(/export const USER_STATUSES/);
    expect(out).toMatch(/status: z\.enum\(USER_STATUSES\)/);
    // No min/max length chaining after enum
    const enumLine =
      out.split('\n').find((l) => /status: z\.enum/.test(l)) || '';
    expect(enumLine).not.toMatch(/\.min\(|\.max\(/);
  });

  it('creates json schema imports when configured', async () => {
    const tbl = table([
      column({ name: 'profile', type: 'json', dataType: 'jsonb' }),
      column({
        name: 'meta',
        type: 'json',
        dataType: 'json',
        isNullable: true,
        isReadOptional: true,
      }),
    ]);
    const out = await new ZodBaseRenderer().renderSchemaFile(tbl, {
      ...baseConfig,
      jsonSchemaImportLocation: '@schemas',
    });
    expect(out).toMatch(
      /import { UserProfileSchema, UserMetaSchema } from '@schemas'/
    );
    expect(out).toContain('profile: UserProfileSchema');
    expect(out).toMatch(
      /meta: UserMetaSchema\.nullable\(\)\.transform\(\(value\) => value \?\? undefined\)\.optional\(\)/
    );
  });

  it('respects stringifyJson flag set to false', async () => {
    const tbl = table([
      column({ name: 'profile', type: 'json', dataType: 'jsonb' }),
    ]);
    const out = await new ZodBaseRenderer().renderSchemaFile(tbl, {
      ...baseConfig,
      stringifyJson: false,
    });
    expect(out).not.toMatch(/JSON\.stringify/);
  });

  it('does not stringify nullable json when stringifyJson is false', async () => {
    const tbl = table([
      column({
        name: 'meta',
        type: 'json',
        dataType: 'jsonb',
        isNullable: true,
      }),
    ]);
    const out = await new ZodBaseRenderer().renderSchemaFile(tbl, {
      ...baseConfig,
      stringifyJson: false,
    });
    // write schema should not contain JSON.stringify for meta
    expect(out).not.toMatch(/meta: .*JSON\.stringify/);
  });

  it('excludes non-writable columns (serial & non-table types) from write schema', async () => {
    const writable = column({ name: 'email', type: 'string' });
    const serial = column({
      name: 'id',
      type: 'int',
      isSerial: true,
      isWritable: false,
    });

    const tbl: ZodDbsTable = {
      type: 'table',
      name: 'users',
      schemaName: 'public',
      columns: [writable, serial],
    };

    const out = await new ZodBaseRenderer().renderSchemaFile(tbl, baseConfig);

    // Extract write base schema object content
    const writeSectionMatch = out.match(
      /UsersTableInsertBaseSchema = z\.object\(\{([\s\S]*?)\n\}\);/
    );
    const writeContent = writeSectionMatch ? writeSectionMatch[1] : '';

    expect(writeContent).toContain('email: z.string()');
    expect(writeContent).not.toContain('id: z.number()');
  });

  it('applies all writeTransforms in order (trim, lowercase, uppercase, normalize)', async () => {
    const tbl = table([column({ name: 'value', type: 'string' })]);
    const out = await new ZodBaseRenderer({
      onColumnModelCreated: (m) => ({
        ...m,
        writeTransforms: ['trim', 'lowercase', 'uppercase', 'normalize'] as any,
      }),
    }).renderSchemaFile(tbl, baseConfig);
    expect(out).toMatch(
      /value: z\.string\(\)\.trim\(\)\.lowercase\(\)\.uppercase\(\)\.normalize\(\)/
    );
  });

  it('handles optional only (not nullable) field with correct transform logic', async () => {
    const tbl = table([
      column({
        name: 'nickname',
        type: 'string',
        isReadOptional: true,
        isNullable: false,
      }),
    ]);
    const out = await new ZodBaseRenderer().renderSchemaFile(tbl, baseConfig);
    expect(out).toMatch(
      /nickname: z\.string\(\)\.transform\(\(value\) => value \?\? undefined\)\.optional\(\)/
    );
  });

  it('omits json schema import section when location configured but no json columns', async () => {
    const tbl = table([column({ name: 'username', type: 'string' })]);
    const out = await new ZodBaseRenderer().renderSchemaFile(tbl, {
      ...baseConfig,
      jsonSchemaImportLocation: '@schemas',
    });
    expect(out).not.toMatch(/from '@schemas'/);
  });

  it('onColumnModelCreated and onTableModelCreated hooks modify output & re-render types', async () => {
    const tbl = table([column({ name: 'count', type: 'string' })]);
    const out = await new ZodBaseRenderer({
      onColumnModelCreated: (m) => ({ ...m, type: 'int' }),
      onTableModelCreated: (t) => ({
        ...t,
        tableReadSchemaName: 'CustomUsersSchema',
      }),
    }).renderSchemaFile(tbl, baseConfig);
    expect(out).toContain('count: z.number()');
    expect(out).toContain('export const CustomUsersSchema');
  });

  it('uses schema.simple template when caseTransform is false', async () => {
    const tbl = table([column({ name: 'id', type: 'int' })]);
    const out = await new ZodBaseRenderer().renderSchemaFile(tbl, {
      ...baseConfig,
      caseTransform: false,
    });
    expect(out).toContain('export const UsersTableSchema = z.object');
    // Should not output BaseSchema or transform function names
    expect(out).not.toMatch(/BaseSchema/);
    expect(out).not.toMatch(/transformUser/);
  });

  it('does not add null-to-undefined transform when defaultNullsToUndefined is false', async () => {
    const tbl = table([
      column({
        name: 'maybe',
        type: 'string',
        isNullable: true,
        isReadOptional: true,
      }),
    ]);
    const out = await new ZodBaseRenderer().renderSchemaFile(tbl, {
      ...baseConfig,
      defaultNullsToUndefined: false,
      defaultEmptyArray: false,
    });
    // Read path: expect nullable + optional but no transform((value) => value ?? undefined)
    const line =
      out.split('\n').find((l) => /maybe: z\.string\(\)/.test(l)) || '';
    expect(line).toMatch(/\.nullable\(\)/);
    expect(line).not.toMatch(/value \?\? undefined/);
  });

  it('uses z.unknown() for fallback any type when defaultUnknown=true', async () => {
    const tbl = table([
      column({ name: 'whatever', type: 'any', dataType: 'other' }),
    ]);
    const out = await new ZodBaseRenderer().renderSchemaFile(tbl, {
      ...baseConfig,
      defaultUnknown: true,
    });
    expect(out).toContain('whatever: z.unknown()');
  });

  it('stringifies json fields in write schema (nullable vs non-nullable)', async () => {
    const tbl = table([
      column({ name: 'profile', type: 'json', dataType: 'jsonb' }),
      column({
        name: 'meta',
        type: 'json',
        dataType: 'jsonb',
        isNullable: true,
        isWriteOptional: true,
      }),
    ]);
    const out = await new ZodBaseRenderer().renderSchemaFile(tbl, baseConfig);
    // Non-nullable json -> direct JSON.stringify
    expect(out).toMatch(/profile: .*JSON\.stringify/);
    // Nullable json -> conditional JSON.stringify
    expect(out).toMatch(/meta: .*value \? JSON\.stringify\(value\) : value/);
  });

  it('stringifies nullable single date field correctly', async () => {
    const tbl = table([
      column({
        name: 'last_seen',
        type: 'date',
        dataType: 'timestamptz',
        isNullable: true,
        isWriteOptional: true,
      }),
    ]);
    const out = await new ZodBaseRenderer().renderSchemaFile(tbl, baseConfig);
    // Write schema should transform conditionally
    expect(out).toMatch(
      /lastSeen: z\.date\(\)\.nullable\(\)\.transform\(\(value\) => value \? value\.toISOString\(\) : value\)\.optional\(\)/
    );
  });

  it('applies nonnegative transform for number columns', async () => {
    const tbl = table([
      column({
        name: 'age',
        type: 'number',
        writeTransforms: ['nonnegative'] as any,
      }),
    ]);
    const out = await new ZodBaseRenderer().renderSchemaFile(tbl, baseConfig);
    expect(out).toMatch(/age: z\.number\(\)\.nonnegative\(\)/);
  });

  it('marks optional-only field as optional in write schema', async () => {
    const tbl = table([
      column({ name: 'nickname', type: 'string', isWriteOptional: true }),
    ]);
    const out = await new ZodBaseRenderer().renderSchemaFile(tbl, baseConfig);
    // In insert base schema we expect .optional()
    const insertBaseMatch = out.match(
      /UsersTableInsertBaseSchema = z\.object\(\{([\s\S]*?)\n\}\);/
    );
    const insertContent = insertBaseMatch ? insertBaseMatch[1] : '';
    expect(insertContent).toMatch(/nickname: z\.string\(\)\.optional\(\)/);
  });

  it('ignores writeTransforms for enum columns', async () => {
    const tbl = table([
      column({
        name: 'status',
        type: 'string',
        isEnum: true,
        enumValues: ['active', 'inactive'],
      }),
    ]);
    const out = await new ZodBaseRenderer({
      onColumnModelCreated: (m) => ({
        ...m,
        writeTransforms: ['trim', 'lowercase'] as any,
      }),
    }).renderSchemaFile(tbl, baseConfig);
    const line = out.split('\n').find((l) => /status: z\.enum/.test(l)) || '';
    expect(line).toMatch(/status: z\.enum/);
    expect(line).not.toMatch(/trim\(|lowercase\(/);
  });

  it('ignores string writeTransforms for non-string base types (date, json, boolean)', async () => {
    const tbl = table([
      column({ name: 'created_at', type: 'date', dataType: 'timestamptz' }),
      column({ name: 'settings', type: 'json', dataType: 'jsonb' }),
      column({ name: 'is_active', type: 'boolean', dataType: 'bool' }),
    ]);
    const out = await new ZodBaseRenderer({
      onColumnModelCreated: (m) => ({
        ...m,
        writeTransforms: ['trim', 'lowercase', 'uppercase', 'normalize'] as any,
      }),
    }).renderSchemaFile(tbl, baseConfig);
    const relevant = out
      .split('\n')
      .filter((l) => /createdAt:|settings:|is_active:/.test(l))
      .join('\n');
    expect(relevant).not.toMatch(/trim\(|lowercase\(|uppercase\(|normalize\(/);
  });

  it('handles empty writeTransforms array without adding transforms', async () => {
    const tbl = table([column({ name: 'title', type: 'string' })]);
    const out = await new ZodBaseRenderer({
      onColumnModelCreated: (m) => ({ ...m, writeTransforms: [] }),
    }).renderSchemaFile(tbl, baseConfig);
    const line = out.split('\n').find((l) => /title: z\.string/.test(l)) || '';
    expect(line).toMatch(/title: z\.string\(\),?$/); // no chained transform methods before comma
    expect(line).not.toMatch(
      /\.trim\(|\.lowercase\(|\.uppercase\(|\.normalize\(/
    );
  });

  it('applies null-to-undefined transform for nullable-only (not optional) read field', async () => {
    const tbl = table([
      column({
        name: 'note',
        type: 'string',
        isNullable: true,
        isReadOptional: false,
      }),
    ]);
    const out = await new ZodBaseRenderer().renderSchemaFile(tbl, baseConfig);
    // Read schema line should have nullable + transform but no .optional()
    const line = out.split('\n').find((l) => /note: z\.string/.test(l)) || '';
    expect(line).toMatch(/\.nullable\(\)/);
    expect(line).toMatch(/transform\(\(value\) => value \?\? undefined\)/);
    expect(line).not.toMatch(/\.optional\(\)/);
  });

  it('uses undefined transform instead of empty array when defaultEmptyArray is false for nullable array', async () => {
    const tbl = table([
      column({
        name: 'labels',
        type: 'string',
        dataType: '_text',
        isArray: true,
        isNullable: true,
        isReadOptional: true,
      }),
    ]);
    const out = await new ZodBaseRenderer().renderSchemaFile(tbl, {
      ...baseConfig,
      defaultEmptyArray: false,
    });
    expect(out).toMatch(
      /labels: z\.array\(z\.string\(\)\)\.nullable\(\)\.transform\(\(value\) => value \?\? undefined\)\.optional\(\)/
    );
    expect(out).not.toMatch(/value \?\? \[\]/);
  });

  it('renders boolean field', async () => {
    const tbl = table([
      column({ name: 'is_active', type: 'boolean', dataType: 'bool' }),
    ]);
    const out = await new ZodBaseRenderer().renderSchemaFile(tbl, baseConfig);
    expect(out).toContain('is_active: z.boolean()');
  });

  it('applies min/max constraints to number field on write schema', async () => {
    const tbl = table([
      column({
        name: 'score',
        type: 'number',
        dataType: 'int4',
        minLen: 1,
        maxLen: 100,
      }),
    ]);
    const out = await new ZodBaseRenderer().renderSchemaFile(tbl, baseConfig);
    expect(out).toMatch(/score: z\.number\(\)\.min\(1\)\.max\(100\)/);
  });

  it('does not stringify date or date arrays when stringifyDates is false', async () => {
    const tbl = table([
      column({ name: 'created_at', type: 'date', dataType: 'timestamptz' }),
      column({
        name: 'event_dates',
        type: 'date',
        dataType: 'timestamptz',
        isArray: true,
      }),
      column({
        name: 'maybe_date',
        type: 'date',
        dataType: 'timestamptz',
        isNullable: true,
        isWriteOptional: true,
      }),
    ]);
    const out = await new ZodBaseRenderer().renderSchemaFile(tbl, {
      ...baseConfig,
      stringifyDates: false,
    });
    // Ensure no toISOString transforms appear for these fields in write base schema
    const writeSection = out
      .split('\n')
      .filter((l) => /createdAt:|eventDates:|maybeDate:/.test(l))
      .join('\n');
    expect(writeSection).not.toMatch(/toISOString/);
  });
});
