/**
 * Note that this file relies on the generated files from the integration/pg/tests/basic.test.ts test suite.
 * After initial checkout or if the test files are deleted, run the `pnpm run test:integration:pg` command first.
 */
import { sql } from 'zod-dbs-core';

import {
  UserInsertRecord,
  UsersTableInsertSchema,
  UsersTableSchema,
} from '../../output/pg/basic/tables/users/index.js';
import {
  setupTestDb,
  teardownTestDb,
  TestDbContext,
} from '../../pg/testDbUtils.js';

let ctx: TestDbContext;

beforeAll(async () => {
  ctx = await setupTestDb();
});

afterAll(async () => {
  await teardownTestDb(ctx);
});

describe('Generated Schema Integration', () => {
  beforeEach(async () => {
    // Clean up any existing data before each test
    await ctx.client.query(sql`DELETE FROM users`);
    await ctx.client.query(sql`ALTER SEQUENCE users_id_seq RESTART WITH 1`);
  });

  it('insert schema works with full record', async () => {
    const createdAt = new Date('2023-10-01T00:00:00Z');

    // Test a complete insert with all available fields
    const insertRecord: UserInsertRecord = {
      name: 'Test User',
      email: 'test@test.com',
      profile: { name: 'Test bio', age: 30 },
      createdAt,
      roles: ['admin', 'editor'],
      status: 'active',
      dates: [createdAt, new Date('2023-10-02T00:00:00Z')],
    };

    // Validate the insert record against the schema
    const parsedInsertRecord = UsersTableInsertSchema.parse(insertRecord);

    // Insert all the fields that were provided
    await ctx.client.query(
      sql`
      INSERT INTO users (name, email, profile, created_at, roles, status, dates)
      VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        parsedInsertRecord.name,
        parsedInsertRecord.email,
        parsedInsertRecord.profile, // JSON.stringify is handled by the schema transform
        parsedInsertRecord.created_at,
        parsedInsertRecord.roles,
        parsedInsertRecord.status,
        parsedInsertRecord.dates,
      ]
    );

    // Retrieve and validate the stored record
    const result = await ctx.client.query<any>(sql`SELECT * FROM users`);
    const userRecord = result[0];

    // Parse the retrieved record with the read schema
    const user = UsersTableSchema.parse(userRecord);

    // Verify the data round-trip worked correctly
    expect(user).toEqual({
      id: 1, // Auto-generated
      name: 'Test User',
      email: 'test@test.com',
      profile: { name: 'Test bio', age: 30 },
      status: 'active',
      createdAt: createdAt,
      roles: ['admin', 'editor'],
      dates: [createdAt, new Date('2023-10-02T00:00:00Z')],
    });
  });

  it('insert schema works with minimal record (defaults and nullables)', async () => {
    // Test with only required fields
    const minimalRecord: UserInsertRecord = {
      name: 'Minimal User',
    };

    const parsedRecord = UsersTableInsertSchema.parse(minimalRecord);

    await ctx.client.query(sql`INSERT INTO users (name) VALUES ($1)`, [
      parsedRecord.name,
    ]);

    const result = await ctx.client.query<any>(sql`SELECT * FROM users`);
    const user = UsersTableSchema.parse(result[0]);

    expect(user).toMatchObject({
      id: 1,
      name: 'Minimal User',
      email: undefined,
      status: 'active', // Database default
      profile: undefined,
      roles: undefined,
      dates: undefined,
      // createdAt will be set by database default (now())
    });
    expect(user.createdAt).toBeInstanceOf(Date);
  });

  it('schema validation catches invalid data', async () => {
    // Test that the schema properly validates constraints
    expect(() => {
      UsersTableInsertSchema.parse({
        name: 'x'.repeat(101), // Exceeds max length of 100
        email: 'valid@email.com',
      });
    }).toThrow();

    expect(() => {
      UsersTableInsertSchema.parse({
        name: 'Valid User',
        roles: ['invalid_role'], // Not in the enum
      });
    }).toThrow();
  });
});
