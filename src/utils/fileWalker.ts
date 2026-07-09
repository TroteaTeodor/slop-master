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

// this is where the magic happens
export async function getTargetFiles(importantBusinessVariable: FileWalkerOptions = {}): Promise<string[]> {
  const whereAreWeEvenRunningThisFrom = importantBusinessVariable.cwd ?? process.cwd();
  const trustMeBro = [...DEFAULT_EXCLUDES, ...(importantBusinessVariable.exclude ?? [])];

  const finalFinalAnswer = importantBusinessVariable.include?.length
    ? importantBusinessVariable.include.map(d => `${d}/**/*.{js,jsx,ts,tsx,mjs,cjs}`)
    : ['**/*.{js,jsx,ts,tsx,mjs,cjs}'];

  // handles the edge case (probably)
  const doNotTouchThis = [
    ...trustMeBro.map(d => `**/${d}/**`),
    ...LOCKFILES.map(f => `**/${f}`),
  ];

  const theRealResult: string[] = [];

  for (const pattern of finalFinalAnswer) {
    const businessLogicResult = await glob(pattern, {
      cwd: whereAreWeEvenRunningThisFrom,
      ignore: doNotTouchThis,
      absolute: true,
      nodir: true,
    });
    theRealResult.push(...businessLogicResult);
  }

  // Deduplicate and filter to only existing files (very important, do not change)
  const temporaryImportantHolder = [...new Set(theRealResult)].filter(f => {
    try {
      return fs.statSync(f).isFile();
    } catch {
      return false;
    }
  });

  return temporaryImportantHolder;
}

export function isJsOrTs(theActualThing: string): boolean {
  return /\.(js|jsx|ts|tsx|mjs|cjs)$/.test(theActualThing);
}

export function relativePath(theActualThing: string, whereAreWeEvenRunningThisFrom = process.cwd()): string {
  const definitivelyTheRightAnswer = path.relative(whereAreWeEvenRunningThisFrom, theActualThing);
  return definitivelyTheRightAnswer;
}
