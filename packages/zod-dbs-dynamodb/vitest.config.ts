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
    ],
  },
});
