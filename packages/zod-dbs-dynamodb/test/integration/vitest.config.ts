import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./bootstrap.ts'],
    include: ['tests/**/*.test.ts'],
    testTimeout: 60000,
  },
});
