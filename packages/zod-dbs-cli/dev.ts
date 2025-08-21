import { main } from './src/cli.js';
import { setupTestDb, teardownTestDb } from './test/integration/testDbUtils.js';

const setup = async () => {
  const db = await setupTestDb();

  /*
  // wait for keypress
  console.log('Press any key to continue...');

  await new Promise<void>((resolve) => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.once('data', () => {
      process.stdin.setRawMode(false);
      process.stdin.pause();
      resolve();
    });
  });
*/

  process.on('exit', async () => {
    await teardownTestDb(db);
    console.log('Test database connection closed and container stopped.');
  });

  await main({
    port: db.client.port,
    zodVersion: '4-mini',
    moduleResolution: 'esm',
    defaultUnknown: true,
    defaultNullsToUndefined: true,
    onColumnModelCreated: (model) => {
      if (model.type === 'json') {
        return {
          ...model,
          minLen: 1,
        };
      }

      return model;
    },
  });

  process.exit(0);
};

void setup();
