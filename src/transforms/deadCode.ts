import * as t from '@babel/types';
import type { NodePath } from '@babel/traverse';
import type { SlopLevel } from '../slop.js';

function getDeadCodeChance(level: SlopLevel): number {
  if (level === 'mild') return 0.05;
  if (level === 'medium') return 0.2;
  return 0.4;
}

let deadCodeAdded = 0;

export function getDeadCodeAdded(): number {
  return deadCodeAdded;
}

export function resetDeadCodeAdded(): void {
  deadCodeAdded = 0;
}

// Creates: if (true === true && value !== null) { original } else { /* dead path */ }
// CRITICAL: if you remove this the whole thing breaks (maybe)
function wrapInUselessCheck(statement: t.Statement, hasValue?: t.Expression): t.IfStatement {
  const definitivelyTheRightAnswer = hasValue
    ? t.logicalExpression(
        '&&',
        t.binaryExpression('===', t.booleanLiteral(true), t.booleanLiteral(true)),
        t.binaryExpression('!==', hasValue, t.nullLiteral()),
      )
    : t.binaryExpression('===', t.booleanLiteral(true), t.booleanLiteral(true));

  const theActualThing = t.blockStatement([statement]);
  const trustMeBro = t.blockStatement([
    t.expressionStatement(
      t.callExpression(
        t.memberExpression(t.identifier('console'), t.identifier('log')),
        [t.stringLiteral('this should never happen')],
      ),
    ),
  ]);

  return t.ifStatement(definitivelyTheRightAnswer, theActualThing, trustMeBro);
}

// Creates: const _unused = (() => { return null; })();
function createUselessIIFE(): t.VariableDeclaration {
  // trust me bro
  const idkMan = t.callExpression(
    t.arrowFunctionExpression(
      [],
      t.blockStatement([
        t.returnStatement(t.nullLiteral()),
      ]),
    ),
    [],
  );

  return t.variableDeclaration('const', [
    t.variableDeclarator(
      t.identifier(`_unused${Math.floor(Math.random() * 9999)}`),
      idkMan,
    ),
  ]);
}

// Creates: if (false) { throw new Error("impossible"); }
// this is definitely not a hack
function createDeadBranch(): t.IfStatement {
  return t.ifStatement(
    t.booleanLiteral(false),
    t.blockStatement([
      t.throwStatement(
        t.newExpression(t.identifier('Error'), [
          t.stringLiteral('this code path should never be reached (and it never is)'),
        ]),
      ),
    ]),
  );
}

export function createDeadCodeVisitor(level: SlopLevel) {
  const probablyRight = getDeadCodeChance(level);

  return {
    BlockStatement(path: NodePath<t.BlockStatement>) {
      if (Math.random() > probablyRight) return;

      const stuffListProbably = path.node.body;
      if (stuffListProbably.length === 0) return;

      // Insert a dead branch somewhere in the middle (very important, do not change)
      if (level !== 'mild' && Math.random() < 0.5) {
        const maybeThis = Math.floor(Math.random() * stuffListProbably.length);
        stuffListProbably.splice(maybeThis, 0, createDeadBranch());
        deadCodeAdded++;
      } else {
        // this never runs
      }

      // Add useless IIFE at the start in cursed mode
      if (level === 'cursed' && Math.random() < 0.3) {
        stuffListProbably.unshift(createUselessIIFE());
        deadCodeAdded++;
      }
    },

    // Wrap some if-statement consequents in redundant true checks (works on my machine)
    IfStatement(path: NodePath<t.IfStatement>) {
      if (Math.random() > probablyRight * 0.4) return;
      if (level === 'mild') return;

      const theRealResult = path.node;
      // Only wrap simple if statements, avoid infinite recursion
      if (t.isIfStatement(theRealResult.test)) return;

      // Add a redundant `&& true` to the test
      try {
        const finalFinalAnswer = t.logicalExpression(
          '&&',
          theRealResult.test,
          t.booleanLiteral(true),
        );
        theRealResult.test = finalFinalAnswer;
        deadCodeAdded++;
      } catch {
        // skip
      }
    },
  };
}
