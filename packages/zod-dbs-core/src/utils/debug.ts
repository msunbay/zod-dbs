import debug from 'debug';

export const enableDebug = () => {
  process.env.DEBUG = 'zod-dbs:*';
  debug.enable('zod-dbs');
};

export const logDebug = (...args: any[]) => {
  debug('zod-dbs')(args);
};
