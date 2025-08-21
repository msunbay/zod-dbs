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
          name: 'integration',
          environment: 'node',
          include: ['test/integration/tests/**/*.test.ts'],
          globals: true,
          hookTimeout: 60000,
          testTimeout: 20000,
        },
      },
    ],
  },
});
