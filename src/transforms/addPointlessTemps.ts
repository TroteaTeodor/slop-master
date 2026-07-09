import * as t from '@babel/types';
import type { NodePath } from '@babel/traverse';
import type { SlopLevel } from '../slop.js';

function getInsertChance(level: SlopLevel): number {
  if (level === 'mild') return 0.1;
  if (level === 'medium') return 0.3;
  return 0.55;
}

const TEMP_VAR_NAMES = [
  'temporaryHolder', 'tempResult', 'holdingArea', 'intermediateValue',
  'transitionalData', 'bufferValue', 'scratchPad', 'workingCopy',
  'localCopy', 'safetyNet', 'backupValue', 'checkpointData',
];

let tempVarIndex = 0;

export function resetTempIndex(): void {
  tempVarIndex = 0;
}

function getTempName(): string {
  const base = TEMP_VAR_NAMES[tempVarIndex % TEMP_VAR_NAMES.length];
  const suffix = tempVarIndex >= TEMP_VAR_NAMES.length
    ? String(Math.floor(tempVarIndex / TEMP_VAR_NAMES.length) + 1)
    : '';
  tempVarIndex++;
  return base + suffix;
}

let slopAdded = 0;

export function getTempsAdded(): number {
  return slopAdded;
}

export function resetTempsAdded(): void {
  slopAdded = 0;
}

export function createPointlessTempsVisitor(level: SlopLevel) {
  const chance = getInsertChance(level);

  return {
    ReturnStatement(path: NodePath<t.ReturnStatement>) {
      if (!path.node.argument) return;
      if (Math.random() > chance) return;

      // Don't wrap if already a simple identifier
      const arg = path.node.argument;
      if (t.isIdentifier(arg) && arg.name.length < 20) {
        // Still add a pointless reassignment
        if (level === 'cursed' && Math.random() < 0.4) {
          const tempName = getTempName();
          const tempDecl = t.variableDeclaration('const', [
            t.variableDeclarator(t.identifier(tempName), arg),
          ]);
          const newReturn = t.returnStatement(t.identifier(tempName));

          try {
            path.insertBefore(tempDecl);
            path.replaceWith(newReturn);
            slopAdded++;
          } catch {
            // Can't transform this one
          }
        }
        return;
      }

      // Extract the return value into a temp variable
      const tempName = getTempName();
      const tempDecl = t.variableDeclaration('const', [
        t.variableDeclarator(t.identifier(tempName), arg),
      ]);
      const newReturn = t.returnStatement(t.identifier(tempName));

      try {
        path.insertBefore(tempDecl);
        path.replaceWith(newReturn);
        slopAdded++;
      } catch {
        // Some paths can't be transformed
      }
    },

    // Convert arrow function bodies to block bodies with temp vars
    ArrowFunctionExpression(path: NodePath<t.ArrowFunctionExpression>) {
      if (Math.random() > chance * 0.5) return;
      if (t.isBlockStatement(path.node.body)) return;

      const body = path.node.body;
      const tempName = getTempName();

      const blockBody = t.blockStatement([
        t.variableDeclaration('const', [
          t.variableDeclarator(t.identifier(tempName), body),
        ]),
        t.returnStatement(t.identifier(tempName)),
      ]);

      try {
        path.node.body = blockBody;
        slopAdded++;
      } catch {
        // skip
      }
    },
  };
}
