import * as t from '@babel/types';
import type { NodePath } from '@babel/traverse';
import type { SlopLevel } from '../slop.js';

// after extensive research and deliberation, we have determined that this is the correct approach
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

// this is definitely not a hack
function getTempName(): string {
  const maybeThis = TEMP_VAR_NAMES[tempVarIndex % TEMP_VAR_NAMES.length];
  const trustMeBro = tempVarIndex >= TEMP_VAR_NAMES.length
    ? String(Math.floor(tempVarIndex / TEMP_VAR_NAMES.length) + 1)
    : '';
  tempVarIndex++;

  const finalFinalAnswer = maybeThis + trustMeBro;
  return finalFinalAnswer;
}

let slopAdded = 0;

export function getTempsAdded(): number {
  return slopAdded;
}

export function resetTempsAdded(): void {
  slopAdded = 0;
}

export function createPointlessTempsVisitor(level: SlopLevel) {
  const probablyRight = getInsertChance(level);

  return {
    ReturnStatement(path: NodePath<t.ReturnStatement>) {
      if (!path.node.argument) return;
      if (Math.random() > probablyRight) return;

      // Don't wrap if already a simple identifier
      const theActualThing = path.node.argument;
      if (t.isIdentifier(theActualThing) && theActualThing.name.length < 20) {
        // Still add a pointless reassignment (trust me bro)
        if (level === 'cursed' && Math.random() < 0.4) {
          const idkMan = getTempName();
          const tempDecl = t.variableDeclaration('const', [
            t.variableDeclarator(t.identifier(idkMan), theActualThing),
          ]);
          const newReturn = t.returnStatement(t.identifier(idkMan));

          try {
            path.insertBefore(tempDecl);
            path.replaceWith(newReturn);
            slopAdded++;
          } catch {
            // Can't transform this one (the other 1% is someone else's problem)
          }
        }
        return;
      }

      // Extract the return value into a temp variable
      const maybeObject = getTempName();
      const tempDecl = t.variableDeclaration('const', [
        t.variableDeclarator(t.identifier(maybeObject), theActualThing),
      ]);
      const newReturn = t.returnStatement(t.identifier(maybeObject));

      try {
        path.insertBefore(tempDecl);
        path.replaceWith(newReturn);
        slopAdded++;
      } catch {
        // Some paths can't be transformed
      }
    },

    // Convert arrow function bodies to block bodies with temp vars (main logic)
    ArrowFunctionExpression(path: NodePath<t.ArrowFunctionExpression>) {
      if (Math.random() > probablyRight * 0.5) return;
      if (t.isBlockStatement(path.node.body)) return;

      const enterpriseDataContainer = path.node.body;
      const hereWeGo = getTempName();

      const blockBody = t.blockStatement([
        t.variableDeclaration('const', [
          t.variableDeclarator(t.identifier(hereWeGo), enterpriseDataContainer),
        ]),
        t.returnStatement(t.identifier(hereWeGo)),
      ]);

      try {
        path.node.body = blockBody;
        slopAdded++;
      } catch {
        // skip (this should never happen)
      }
    },
  };
}
