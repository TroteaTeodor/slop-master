import * as babel from '@babel/core';
import traverse from '@babel/traverse';
import generate from '@babel/generator';
import * as t from '@babel/types';
import fs from 'fs';
import path from 'path';

import { createRenameVisitor, resetSlopCount, getSlopCount } from './transforms/renameVariables.js';
import { createPointlessTempsVisitor, resetTempIndex, getTempsAdded, resetTempsAdded } from './transforms/addPointlessTemps.js';
import { createUselessCommentsVisitor, getCommentsAdded, resetCommentsAdded } from './transforms/addUselessComments.js';
import { createDeadCodeVisitor, getDeadCodeAdded, resetDeadCodeAdded } from './transforms/deadCode.js';

export type SlopLevel = 'mild' | 'medium' | 'cursed';

export interface SlopResult {
  file: string;
  original: string;
  slopped: string;
  slopScore: number;
  changes: number;
  error?: string;
}

export interface SlopOptions {
  level: SlopLevel;
  dryRun?: boolean;
}

const PARSE_PLUGINS: babel.ParserOptions['plugins'] = [
  'typescript',
  'jsx',
  'decorators-legacy',
  'classProperties',
  'classPrivateProperties',
  'classPrivateMethods',
  'exportDefaultFrom',
  'exportNamespaceFrom',
  'dynamicImport',
  'nullishCoalescingOperator',
  'optionalChaining',
  'logicalAssignment',
  'numericSeparator',
  'importMeta',
  'topLevelAwait',
  'importAssertions',
];

export async function slopifyFile(filePath: string, options: SlopOptions): Promise<SlopResult> {
  const original = fs.readFileSync(filePath, 'utf-8');

  // Reset counters
  resetSlopCount();
  resetTempIndex();
  resetTempsAdded();
  resetCommentsAdded();
  resetDeadCodeAdded();

  let ast: t.File;
  try {
    ast = babel.parseSync(original, {
      filename: filePath,
      parserOpts: {
        plugins: PARSE_PLUGINS,
        errorRecovery: true,
      },
      configFile: false,
      babelrc: false,
    }) as t.File;
  } catch (err: unknown) {
    return {
      file: filePath,
      original,
      slopped: original,
      slopScore: 0,
      changes: 0,
      error: `Parse error: ${(err as Error).message}`,
    };
  }

  if (!ast) {
    return {
      file: filePath,
      original,
      slopped: original,
      slopScore: 0,
      changes: 0,
      error: 'Could not parse file',
    };
  }

  // Apply transforms in order
  const visitors = [
    createUselessCommentsVisitor(options.level),
    createDeadCodeVisitor(options.level),
    createPointlessTempsVisitor(options.level),
    createRenameVisitor(options.level), // Rename last so temp vars don't get renamed
  ];

  for (const visitor of visitors) {
    try {
      traverse(ast, visitor as Parameters<typeof traverse>[1]);
    } catch {
      // Continue with other transforms even if one fails
    }
  }

  let slopped: string;
  try {
    const output = generate(ast, {
      retainLines: false,
      compact: false,
      concise: false,
      comments: true,
    }, original);
    slopped = output.code;
  } catch (err: unknown) {
    return {
      file: filePath,
      original,
      slopped: original,
      slopScore: 0,
      changes: 0,
      error: `Generate error: ${(err as Error).message}`,
    };
  }

  const totalChanges = getSlopCount() + getTempsAdded() + getCommentsAdded() + getDeadCodeAdded();
  const slopScore = Math.min(100, Math.round(totalChanges * 8));

  if (!options.dryRun) {
    fs.writeFileSync(filePath, slopped, 'utf-8');
  }

  return {
    file: filePath,
    original,
    slopped,
    slopScore,
    changes: totalChanges,
  };
}

export function calculateTotalSlopScore(results: SlopResult[]): number {
  if (results.length === 0) return 0;
  const total = results.reduce((sum, r) => sum + r.slopScore, 0);
  return Math.min(100, Math.round(total / results.length));
}
