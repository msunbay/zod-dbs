import { execSync } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

export const getCliPath = (): string => {
  return path.resolve(import.meta.dirname, '../../index.js');
};

export const executeCli = (args: string): void => {
  const cliPath = getCliPath();

  try {
    execSync(`node ${cliPath} ${args}`);
  } catch (err: any) {
    // execSync error has stdout/stderr buffers; surface them for test diagnostics
    const stdout = err?.stdout?.toString?.() ?? '';
    const stderr = err?.stderr?.toString?.() ?? '';
    // Print to console to show in vitest output
    if (stdout) {
      console.log('\n[CLI stdout]\n' + stdout);
    }
    if (stderr) {
      console.error('\n[CLI stderr]\n' + stderr);
    }
    // Also include status and message for clarity
    const status =
      typeof err?.status !== 'undefined' ? ` (status ${err.status})` : '';
    throw new Error(
      `CLI execution failed${status}. ${err?.message ?? ''}`.trim()
    );
  }
};

export const getProviderOutputDir = (
  provider: string,
  testSuite: string,
  subPath = ''
): string =>
  path.resolve(import.meta.dirname, `./output/`, provider, testSuite, subPath);

export async function getOutputFiles(dir: string): Promise<string[]> {
  let results: string[] = [];
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
  await fs.rm(dir, { recursive: true });
}
