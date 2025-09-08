import { exec } from 'node:child_process';
import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

export const getCliPath = (): string => {
  return path.resolve(
    import.meta.dirname,
    '../../../packages/zod-dbs-cli/index.js'
  );
};

export class CliExecutionError extends Error {
  status?: number | string;
  stdout?: string;
  stderr?: string;

  constructor(
    message: string,
    status?: number | string,
    stdout?: string,
    stderr?: string
  ) {
    super(message);
    this.name = 'CliExecutionError';
    this.status = status;
    this.stdout = stdout;
    this.stderr = stderr;
  }
}

export const executeCli = async (
  args: string,
  { logErrors = true }: { logErrors?: boolean } = {}
): Promise<string> => {
  const cliPath = getCliPath();

  try {
    const { stdout } = await execAsync(`node ${cliPath} ${args}`, {
      maxBuffer: 10 * 1024 * 1024,
      shell: 'bash',
    });

    return (stdout ?? '').toString();
  } catch (err: any) {
    const stdout = err?.stdout?.toString?.() ?? '';
    const stderr = err?.stderr?.toString?.() ?? '';

    if (stdout && logErrors) {
      console.log(`\n[CLI stdout]\n${stdout}`);
    }

    if (stderr && logErrors) {
      console.error(`\n[CLI stderr]\n${stderr}`);
    }

    const status =
      typeof err?.code !== 'undefined' ? ` (status ${err.code})` : '';

    throw new CliExecutionError(
      `CLI execution failed${status}. ${err?.message ?? ''}\n${stdout}\n${stderr}`.trim(),
      err?.code,
      stdout,
      stderr
    );
  }
};

export const getProviderOutputDir = (
  provider: string,
  testSuite = '',
  subPath = ''
): string =>
  path.resolve(
    import.meta.dirname,
    '../',
    provider,
    `./output/`,
    testSuite,
    subPath
  );

export async function getOutputFiles(dir: string): Promise<string[]> {
  let results: string[] = [];

  if (existsSync(dir) === false) {
    return results;
  }

  const list = await fs.readdir(dir, { withFileTypes: true });

  for (const file of list) {
    const filePath = path.join(dir, file.name);

    if (file.isDirectory()) {
      results = results.concat(await getOutputFiles(filePath));
    } else {
      results.push(filePath);
    }
  }

  return results;
}

export async function deleteOutputFiles(dir: string): Promise<void> {
  if (existsSync(dir) === false) return;

  await fs.rm(dir, { recursive: true });
}
