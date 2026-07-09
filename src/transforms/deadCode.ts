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
function wrapInUselessCheck(statement: t.Statement, hasValue?: t.Expression): t.IfStatement {
  const test = hasValue
    ? t.logicalExpression(
        '&&',
        t.binaryExpression('===', t.booleanLiteral(true), t.booleanLiteral(true)),
        t.binaryExpression('!==', hasValue, t.nullLiteral()),
      )
    : t.binaryExpression('===', t.booleanLiteral(true), t.booleanLiteral(true));

  const consequent = t.blockStatement([statement]);
  const alternate = t.blockStatement([
    t.expressionStatement(
      t.callExpression(
        t.memberExpression(t.identifier('console'), t.identifier('log')),
        [t.stringLiteral('this should never happen')],
      ),
    ),
  ]);

  return t.ifStatement(test, consequent, alternate);
}

// Creates: const _unused = (() => { return null; })();
function createUselessIIFE(): t.VariableDeclaration {
  const iife = t.callExpression(
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
      iife,
    ),
  ]);
}

// Creates: if (false) { throw new Error("impossible"); }
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
  const chance = getDeadCodeChance(level);

  return {
    BlockStatement(path: NodePath<t.BlockStatement>) {
      if (Math.random() > chance) return;

      const body = path.node.body;
      if (body.length === 0) return;

      // Insert a dead branch somewhere in the middle
      if (level !== 'mild' && Math.random() < 0.5) {
        const insertAt = Math.floor(Math.random() * body.length);
        body.splice(insertAt, 0, createDeadBranch());
        deadCodeAdded++;
      }

      // Add useless IIFE at the start in cursed mode
      if (level === 'cursed' && Math.random() < 0.3) {
        body.unshift(createUselessIIFE());
        deadCodeAdded++;
      }
    },

    // Wrap some if-statement consequents in redundant true checks
    IfStatement(path: NodePath<t.IfStatement>) {
      if (Math.random() > chance * 0.4) return;
      if (level === 'mild') return;

      const node = path.node;
      // Only wrap simple if statements, avoid infinite recursion
      if (t.isIfStatement(node.test)) return;

      // Add a redundant `&& true` to the test
      try {
        const newTest = t.logicalExpression(
          '&&',
          node.test,
          t.booleanLiteral(true),
        );
        node.test = newTest;
        deadCodeAdded++;
      } catch {
        // skip
      }
    },
  };
}
