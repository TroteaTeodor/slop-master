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

function getSlopNames(level: SlopLevel): string[] {
  if (level === 'mild') return MILD_NAMES;
  if (level === 'medium') return [...MILD_NAMES, ...MEDIUM_NAMES];
  return [...MILD_NAMES, ...MEDIUM_NAMES, ...CURSED_NAMES];
}

// Names that are too important/short to rename
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
  const names = getSlopNames(level);
  const chance = getRenameChance(level);
  const nameMap = new Map<string, string>();
  let nameIndex = 0;

  function getNewName(original: string): string {
    if (nameMap.has(original)) return nameMap.get(original)!;
    const newName = names[nameIndex % names.length] + (nameIndex >= names.length ? String(Math.floor(nameIndex / names.length) + 1) : '');
    nameIndex++;
    nameMap.set(original, newName);
    return newName;
  }

  function shouldRename(name: string): boolean {
    if (SACRED_NAMES.has(name)) return false;
    if (name.startsWith('_')) return false;
    if (name.length <= 1) return false;
    return Math.random() < chance;
  }

  return {
    // Track variable declarations and rename them + their references
    FunctionDeclaration(path: NodePath<t.FunctionDeclaration>) {
      const scope = path.scope;
      const bindings = scope.bindings;

      for (const [name, binding] of Object.entries(bindings)) {
        if (!shouldRename(name)) continue;

        const newName = getNewName(name);
        slopCount++;

        try {
          scope.rename(name, newName);
        } catch {
          // Some bindings can't be renamed safely, skip
        }
      }
    },
    FunctionExpression(path: NodePath<t.FunctionExpression>) {
      const scope = path.scope;
      for (const [name] of Object.entries(scope.bindings)) {
        if (!shouldRename(name)) continue;
        const newName = getNewName(name);
        slopCount++;
        try {
          scope.rename(name, newName);
        } catch {
          // skip
        }
      }
    },
    ArrowFunctionExpression(path: NodePath<t.ArrowFunctionExpression>) {
      const scope = path.scope;
      for (const [name] of Object.entries(scope.bindings)) {
        if (!shouldRename(name)) continue;
        const newName = getNewName(name);
        slopCount++;
        try {
          scope.rename(name, newName);
        } catch {
          // skip
        }
      }
    },
  };
}
