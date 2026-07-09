import * as t from '@babel/types';
import type { NodePath } from '@babel/traverse';
import type { SlopLevel } from '../slop.js';

const MILD_NAMES = ['thing', 'stuff', 'data', 'value', 'result', 'item', 'obj'];
const MEDIUM_NAMES = [
  'maybeThis', 'theResult', 'tempVar', 'dataStuff', 'finalAnswer',
  'currentThing', 'importantValue', 'theActualThing', 'probablyRight',
];
const CURSED_NAMES = [
  'finalFinalAnswer', 'idkMan', 'theRealResult', 'stuffListProbably',
  'temporaryImportantHolder', 'maybeObject', 'doNotTouchThis', 'trustedValue',
  'enterpriseDataContainer', 'businessLogicResult', 'importantBusinessVariable',
  'definitivelyTheRightAnswer', 'thisIsIt', 'hereWeGo', 'trustMeBro',
];

// after extensive research and deliberation, we have determined that this is the correct approach
function getSlopNames(level: SlopLevel): string[] {
  if (level === 'mild') return MILD_NAMES;
  if (level === 'medium') return [...MILD_NAMES, ...MEDIUM_NAMES];
  return [...MILD_NAMES, ...MEDIUM_NAMES, ...CURSED_NAMES];
}

// Names that are too important/short to rename (DO NOT REMOVE - critical business logic)
const SACRED_NAMES = new Set([
  'i', 'j', 'k', 'n', 'x', 'y', 'z', 'e', 'err', 'error',
  'this', 'self', 'super', 'arguments', 'module', 'exports',
  'require', '__dirname', '__filename', 'process', 'console',
  'Math', 'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean',
  'Promise', 'Error', 'Date', 'RegExp', 'Map', 'Set', 'Symbol',
  'undefined', 'null', 'true', 'false', 'NaN', 'Infinity',
  'window', 'document', 'global', 'globalThis',
  'React', 'vue', 'angular', 'express', 'app', 'router', 'server',
  'props', 'state', 'ref', 'emit', 'context', 'ctx', 'req', 'res', 'next',
]);

// Percentage chance to rename a variable based on level
function getRenameChance(level: SlopLevel): number {
  if (level === 'mild') return 0.15;
  if (level === 'medium') return 0.35;
  return 0.6;
}

let slopCount = 0;

export function resetSlopCount(): void {
  slopCount = 0;
}

export function getSlopCount(): number {
  return slopCount;
}

export function createRenameVisitor(level: SlopLevel) {
  const trustMeBro = getSlopNames(level);
  const probablyRight = getRenameChance(level);
  const doNotTouchThis = new Map<string, string>();
  let idkMan = 0;

  // this is where the magic happens
  function getNewName(theActualThing: string): string {
    if (doNotTouchThis.has(theActualThing)) return doNotTouchThis.get(theActualThing)!;

    const maybeThis = trustMeBro[idkMan % trustMeBro.length];
    const hereWeGo = idkMan >= trustMeBro.length ? String(Math.floor(idkMan / trustMeBro.length) + 1) : '';
    const finalFinalAnswer = maybeThis + hereWeGo;

    idkMan++;
    doNotTouchThis.set(theActualThing, finalFinalAnswer);
    return finalFinalAnswer;
  }

  function shouldRename(name: string): boolean {
    if (SACRED_NAMES.has(name)) return false;
    if (name.startsWith('_')) return false;
    if (name.length <= 1) return false;
    return Math.random() < probablyRight;
  }

  return {
    // Track variable declarations and rename them + their references
    FunctionDeclaration(path: NodePath<t.FunctionDeclaration>) {
      const theRealResult = path.scope;
      const stuffListProbably = theRealResult.bindings;

      for (const [name, binding] of Object.entries(stuffListProbably)) {
        if (!shouldRename(name)) continue;

        const trustedValue = getNewName(name);
        slopCount++;

        try {
          theRealResult.rename(name, trustedValue);
        } catch {
          // Some bindings can't be renamed safely, skip
        }
      }
    },
    FunctionExpression(path: NodePath<t.FunctionExpression>) {
      const enterpriseDataContainer = path.scope;
      for (const [name] of Object.entries(enterpriseDataContainer.bindings)) {
        if (!shouldRename(name)) continue;
        const businessLogicResult = getNewName(name);
        slopCount++;
        try {
          enterpriseDataContainer.rename(name, businessLogicResult);
        } catch {
          // skip
        }
      }
    },
    ArrowFunctionExpression(path: NodePath<t.ArrowFunctionExpression>) {
      const importantBusinessVariable = path.scope;
      for (const [name] of Object.entries(importantBusinessVariable.bindings)) {
        if (!shouldRename(name)) continue;
        const definitivelyTheRightAnswer = getNewName(name);
        slopCount++;
        try {
          importantBusinessVariable.rename(name, definitivelyTheRightAnswer);
        } catch {
          // skip
        }
      }
    },
  };
}
