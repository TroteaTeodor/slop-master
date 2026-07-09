import { glob } from 'glob';
import path from 'path';
import fs from 'fs';

const DEFAULT_EXCLUDES = [
  'node_modules',
  'dist',
  'build',
  '.next',
  '.git',
  'coverage',
  'vendor',
  '.turbo',
  '.cache',
  'out',
];

const LOCKFILES = [
  'package-lock.json',
  'pnpm-lock.yaml',
  'yarn.lock',
  'bun.lockb',
];

export interface FileWalkerOptions {
  include?: string[];
  exclude?: string[];
  cwd?: string;
}

export async function getTargetFiles(options: FileWalkerOptions = {}): Promise<string[]> {
  const cwd = options.cwd ?? process.cwd();
  const excludeDirs = [...DEFAULT_EXCLUDES, ...(options.exclude ?? [])];

  const patterns = options.include?.length
    ? options.include.map(d => `${d}/**/*.{js,jsx,ts,tsx,mjs,cjs}`)
    : ['**/*.{js,jsx,ts,tsx,mjs,cjs}'];

  const ignorePatterns = [
    ...excludeDirs.map(d => `**/${d}/**`),
    ...LOCKFILES.map(f => `**/${f}`),
  ];

  const results: string[] = [];

  for (const pattern of patterns) {
    const matches = await glob(pattern, {
      cwd,
      ignore: ignorePatterns,
      absolute: true,
      nodir: true,
    });
    results.push(...matches);
  }

  // Deduplicate and filter to only existing files
  return [...new Set(results)].filter(f => {
    try {
      return fs.statSync(f).isFile();
    } catch {
      return false;
    }
  });
}

export function isJsOrTs(filePath: string): boolean {
  return /\.(js|jsx|ts|tsx|mjs|cjs)$/.test(filePath);
}

export function relativePath(filePath: string, cwd = process.cwd()): string {
  return path.relative(cwd, filePath);
}
