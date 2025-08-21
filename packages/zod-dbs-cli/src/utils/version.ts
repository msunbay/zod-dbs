import fs from 'fs/promises';
import path from 'path';
import { logDebug, toError } from 'zod-dbs-core';

export const getAppVersion = async (): Promise<string> => {
  try {
    const json = await fs.readFile(
      path.resolve(import.meta.dirname, '../../package.json'),
      'utf8'
    );
    const { version } = JSON.parse(json);
    return version;
  } catch (error) {
    logDebug(
      `Failed to read version from package.json: ${toError(error).message}`
    );
    return '';
  }
};
