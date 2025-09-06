import chalk from 'chalk';

import { maskSensitiveValue } from './mask.js';

export const logSetting = (name: string, value: string | boolean) => {
  let displayValue = value.toString();

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
