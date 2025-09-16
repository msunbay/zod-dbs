import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    reporters: 'dot',
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['test/unit/**/*.test.ts'],
          globals: true,
        },
      },
      {
        test: {
          name: 'integration:dynamodb',
          environment: 'node',
          include: ['test/integration/dynamodb/tests/**/*.test.ts'],
          globalSetup: ['./test/integration/dynamodb/bootstrap.ts'],
          globals: true,
          hookTimeout: 60000,
          testTimeout: 20000,
        },
      },
      {
        test: {
          name: 'integration:pg',
          environment: 'node',
          include: ['test/integration/pg/tests/**/*.test.ts'],
          globalSetup: ['./test/integration/pg/bootstrap.ts'],
          globals: true,
          hookTimeout: 60000,
          testTimeout: 20000,
        },
      },
      {
        test: {
          name: 'integration:mysql',
          environment: 'node',
          include: ['test/integration/mysql/tests/**/*.test.ts'],
          globalSetup: ['./test/integration/mysql/bootstrap.ts'],
          globals: true,
          hookTimeout: 60000,
          testTimeout: 20000,
        },
      },
      {
        test: {
          name: 'integration:mongodb',
          environment: 'node',
          include: ['test/integration/mongodb/tests/**/*.test.ts'],
          globalSetup: ['./test/integration/mongodb/bootstrap.ts'],
          globals: true,
          hookTimeout: 60000,
          testTimeout: 20000,
        },
      },
      {
        test: {
          name: 'integration:mssql',
          environment: 'node',
          include: ['test/integration/mssql/tests/**/*.test.ts'],
          globalSetup: ['./test/integration/mssql/bootstrap.ts'],
          globals: true,
          hookTimeout: 60000,
          testTimeout: 20000,
        },
      },
      {
        test: {
          name: 'integration:sqlite',
          environment: 'node',
          include: ['test/integration/sqlite/tests/**/*.test.ts'],
          globalSetup: ['./test/integration/sqlite/bootstrap.ts'],
          globals: true,
          hookTimeout: 60000,
          testTimeout: 20000,
        },
      },
      {
        test: {
          name: 'integration:oracle',
          environment: 'node',
          include: ['test/integration/oracle/tests/**/*.test.ts'],
          globalSetup: ['./test/integration/oracle/bootstrap.ts'],
          globals: true,
          hookTimeout: 120000,
          testTimeout: 20000,
        },
      },
      {
        test: {
          name: 'integration:snowflake',
          environment: 'node',
          include: ['test/integration/snowflake/tests/**/*.test.ts'],
          globalSetup: ['./test/integration/snowflake/bootstrap.ts'],
          globals: true,
          hookTimeout: 60000,
          testTimeout: 20000,
        },
      },
    ],
  },
});
