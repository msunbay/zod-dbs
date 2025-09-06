import chalk from 'chalk';
import { ZodDbsProvider } from 'zod-dbs-core';

import { maskSensitiveValue } from './mask.js';

export const logSetting = (name: string, value: string | boolean | object) => {
  let displayValue = value.toString();

  if (name === 'provider' && typeof value === 'object' && value !== null) {
    const provider = value as ZodDbsProvider;
    const name = provider.name ?? 'custom provider';

    displayValue = provider.displayName
      ? `${name} (${provider.displayName})`
      : name;
  }

  console.info(
    `- ${chalk.white(name)}: ${chalk.blue(maskSensitiveValue(name, displayValue))}`
  );
};

export const logAppName = (message: string) => {
  console.info(chalk.magenta(`\n${message}\n`));
};

export const logError = (message: string) => {
  console.error(chalk.red(`${message}`));
};

export const logWarning = (message: string) => {
  console.warn(`⚠️ ${message}`);
};
