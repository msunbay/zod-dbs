import debug from 'debug';

export const enableDebug = () => {
  process.env.DEBUG = 'zod-dbs:*';
  debug.enable('zod-dbs');
};

export const logDebug = (formatter: any, ...args: any[]) => {
  const logger = debug('zod-dbs');
  logger(formatter, ...args);
};
