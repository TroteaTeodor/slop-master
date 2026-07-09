import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export interface TestRunner {
  name: string;
  command: string;
  detected: boolean;
}

export function detectTestRunner(cwd = process.cwd()): TestRunner | null {
  const pkgPath = path.join(cwd, 'package.json');

  if (!fs.existsSync(pkgPath)) return null;

  let pkg: Record<string, unknown>;
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  } catch {
    return null;
  }

  const scripts = (pkg.scripts ?? {}) as Record<string, string>;
  const devDeps = (pkg.devDependencies ?? {}) as Record<string, string>;
  const deps = (pkg.dependencies ?? {}) as Record<string, string>;
  const allDeps = { ...devDeps, ...deps };

  // Check for explicit test script
  if (scripts.test && scripts.test !== 'echo "Error: no test specified" && exit 1') {
    const testCmd = scripts.test.toLowerCase();

    if (testCmd.includes('vitest')) {
      return { name: 'vitest', command: 'npm test', detected: true };
    }
    if (testCmd.includes('jest')) {
      return { name: 'jest', command: 'npm test', detected: true };
    }
    if (testCmd.includes('mocha')) {
      return { name: 'mocha', command: 'npm test', detected: true };
    }
    if (testCmd.includes('ava')) {
      return { name: 'ava', command: 'npm test', detected: true };
    }
    if (testCmd.includes('tap')) {
      return { name: 'tap', command: 'npm test', detected: true };
    }
    // Generic test script
    return { name: 'npm test', command: 'npm test', detected: true };
  }

  // Check deps
  if (allDeps.vitest) return { name: 'vitest', command: 'npx vitest run', detected: true };
  if (allDeps.jest) return { name: 'jest', command: 'npx jest', detected: true };
  if (allDeps.mocha) return { name: 'mocha', command: 'npx mocha', detected: true };

  return null;
}

export function runTests(runner: TestRunner, cwd = process.cwd()): { passed: boolean; output: string } {
  try {
    const output = execSync(runner.command, {
      cwd,
      timeout: 120_000,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    return { passed: true, output: output.toString() };
  } catch (err: unknown) {
    const error = err as { stdout?: string; stderr?: string; message?: string };
    const output = [error.stdout ?? '', error.stderr ?? '', error.message ?? ''].join('\n');
    return { passed: false, output };
  }
}
