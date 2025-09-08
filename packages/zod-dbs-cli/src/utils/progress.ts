import mustache from 'mustache';
import ora from 'ora';

const PROGRESS_STATUS: Record<string, string> = {
  connecting: 'Connecting to database...',
  fetchingSchema: 'Fetching schema information...',
  generating: 'Generating {{total}} Zod schemas...',
  done: 'Done',
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
    onProgress: (status: string, args?: unknown) => {
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
