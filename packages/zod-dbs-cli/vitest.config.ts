import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
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
          name: 'integration:cli',
          environment: 'node',
          include: ['test/integration/cli/tests/**/*.test.ts'],
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
          globals: true,
          hookTimeout: 60000,
          testTimeout: 20000,
          setupFiles: ['./test/integration/pg/bootstrap.ts'],
        },
      },
      {
        test: {
          name: 'integration:mysql',
          environment: 'node',
          include: ['test/integration/mysql/tests/**/*.test.ts'],
          globals: true,
          hookTimeout: 60000,
          testTimeout: 20000,
          setupFiles: ['./test/integration/mysql/bootstrap.ts'],
        },
      },
      {
        test: {
          name: 'integration:mongodb',
          environment: 'node',
          include: ['test/integration/mongodb/tests/**/*.test.ts'],
          globals: true,
          hookTimeout: 60000,
          testTimeout: 20000,
          setupFiles: ['./test/integration/mongodb/bootstrap.ts'],
        },
      },
      {
        test: {
          name: 'integration:dynamodb',
          environment: 'node',
          include: ['test/integration/dynamodb/tests/**/*.test.ts'],
          globals: true,
          hookTimeout: 60000,
          testTimeout: 20000,
          setupFiles: ['./test/integration/dynamodb/bootstrap.ts'],
        },
      },
      {
        test: {
          name: 'integration:schema',
          environment: 'node',
          include: ['test/integration/schema/tests/**/*.test.ts'],
          globals: true,
          hookTimeout: 60000,
          testTimeout: 20000,
        },
      },
    ],
  },
});
