import chalk from 'chalk';

export const logSetting = (name: string, value: string) => {
  console.info(`- ${chalk.white(name)}: ${chalk.blue(value)}`);
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
