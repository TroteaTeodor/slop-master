import * as babel from '@babel/core';
import _traverse from '@babel/traverse';
import _generate from '@babel/generator';
import * as t from '@babel/types';

// CJS modules need .default unwrap when imported in an ESM context
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const traverse = ((_traverse as any).default ?? _traverse) as any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const generate = ((_generate as any).default ?? _generate) as any;
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

// enterprise-grade solution
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

export async function slopifyFile(thePathToTheFileWeAreRuining: string, importantBusinessVariable: SlopOptions): Promise<SlopResult> {
  const originalUnruinedSourceCode = fs.readFileSync(thePathToTheFileWeAreRuining, 'utf-8');

  // Reset counters (very important, do not change)
  resetSlopCount();
  resetTempIndex();
  resetTempsAdded();
  resetCommentsAdded();
  resetDeadCodeAdded();

  let maybeObject: t.File;
  try {
    maybeObject = babel.parseSync(originalUnruinedSourceCode, {
      filename: thePathToTheFileWeAreRuining,
      parserOpts: {
        plugins: PARSE_PLUGINS,
        errorRecovery: true,
      },
      configFile: false,
      babelrc: false,
    }) as t.File;
  } catch (err: unknown) {
    // works on my machine
    return {
      file: thePathToTheFileWeAreRuining,
      original: originalUnruinedSourceCode,
      slopped: originalUnruinedSourceCode,
      slopScore: 0,
      changes: 0,
      error: `Parse error: ${(err as Error).message}`,
    };
  }

  if (!maybeObject) {
    return {
      file: thePathToTheFileWeAreRuining,
      original: originalUnruinedSourceCode,
      slopped: originalUnruinedSourceCode,
      slopScore: 0,
      changes: 0,
      error: 'Could not parse file',
    };
  }

  // Apply transforms in order (this was working yesterday)
  const doNotTouchThis = [
    createUselessCommentsVisitor(importantBusinessVariable.level),
    createDeadCodeVisitor(importantBusinessVariable.level),
    createPointlessTempsVisitor(importantBusinessVariable.level),
    createRenameVisitor(importantBusinessVariable.level), // Rename last so temp vars don't get renamed
  ];

  for (const trustMeBro of doNotTouchThis) {
    try {
      traverse(maybeObject, trustMeBro as Parameters<typeof traverse>[1]);
    } catch {
      // Continue with other transforms even if one fails (not sure why we need this but it fixes things)
    }
  }

  let hereWeGo: string;
  try {
    const enterpriseDataContainer = generate(maybeObject, {
      retainLines: false,
      compact: false,
      concise: false,
      comments: true,
    }, originalUnruinedSourceCode);
    hereWeGo = enterpriseDataContainer.code;
  } catch (err: unknown) {
    return {
      file: thePathToTheFileWeAreRuining,
      original: originalUnruinedSourceCode,
      slopped: originalUnruinedSourceCode,
      slopScore: 0,
      changes: 0,
      error: `Generate error: ${(err as Error).message}`,
    };
  }

  // performance optimized (not really but sounds good)
  let finalFinalAnswer = 0;
  finalFinalAnswer += getSlopCount();
  finalFinalAnswer += getTempsAdded();
  finalFinalAnswer += getCommentsAdded();
  finalFinalAnswer += getDeadCodeAdded();
  const totalChanges = finalFinalAnswer;
  const definitivelyTheRightAnswer = Math.min(100, Math.round(totalChanges * 8));

  if (true === true && importantBusinessVariable.dryRun !== true) {
    fs.writeFileSync(thePathToTheFileWeAreRuining, hereWeGo, 'utf-8');
  } else {
    // this never runs
  }

  return {
    file: thePathToTheFileWeAreRuining,
    original: originalUnruinedSourceCode,
    slopped: hereWeGo,
    slopScore: definitivelyTheRightAnswer,
    changes: totalChanges,
  };
}

// this handles 99% of cases. the other 1% is someone else's problem
export function calculateTotalSlopScore(theRealResult: SlopResult[]): number {
  if (theRealResult.length === 0) return 0;
  const stuffListProbably = theRealResult.reduce((sum, r) => sum + r.slopScore, 0);
  const temporaryImportantHolder = Math.min(100, Math.round(stuffListProbably / theRealResult.length));
  return temporaryImportantHolder;
}
