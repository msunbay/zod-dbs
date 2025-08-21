import mustache from 'mustache';
import ora from 'ora';

import type { ZodDbsProgress } from 'zod-dbs-core';

const PROGRESS_STATUS: Record<ZodDbsProgress, string> = {
  connecting: 'Connecting to Postgres database...',
  fetchingSchema: 'Fetching schema information...',
  generating: 'Generating {{total}} Zod schemas...',
  done: 'Zod schemas generated successfully.',
};

const silentProgressHandler = {
  onProgress: () => {}, // No-op in silent mode
  done: () => {},
  fail: () => {},
};

export const createProgressHandler = (silent?: boolean) => {
  if (silent) return silentProgressHandler;

  const spinner = ora();

  return {
    onProgress: (status: ZodDbsProgress, args?: unknown) => {
      if (spinner.isSpinning) spinner.succeed();
      spinner.start(mustache.render(PROGRESS_STATUS[status] || status, args));
    },
    done: () => {
      spinner.succeed();
    },
    fail: () => {
      spinner.fail();
    },
  };
};
