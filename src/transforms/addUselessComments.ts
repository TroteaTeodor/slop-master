import * as t from '@babel/types';
import type { NodePath } from '@babel/traverse';
import type { SlopLevel } from '../slop.js';

const MILD_COMMENTS = [
  ' do the thing',
  ' important logic below',
  ' this is necessary',
  ' process the data',
  ' handle this case',
  ' main logic',
  ' check the value',
  ' return the result',
];

const MEDIUM_COMMENTS = [
  ' this is where the magic happens',
  ' DO NOT REMOVE - critical business logic',
  ' trust me bro',
  ' works on my machine',
  ' TODO: understand why this works',
  ' very important, do not change',
  ' handles the edge case (probably)',
  ' this was working yesterday',
  ' not sure why we need this but it fixes things',
  ' enterprise-grade solution',
];

const CURSED_COMMENTS = [
  ' after extensive research and deliberation, we have determined that this is the correct approach',
  ' NOTE: this code has been peer-reviewed by at least one person (me, just now)',
  ' this code is self-documenting so no explanation needed (jk idk what this does)',
  ' the algorithm here is O(n) or possibly O(n^2) depending on your definition of n',
  ' CRITICAL: if you remove this the whole thing breaks (maybe)',
  ' this is definitely not a hack',
  ' TODO: refactor this into something readable (never)',
  ' performance optimized (not really but sounds good)',
  ' this handles 99% of cases. the other 1% is someone else\'s problem',
  ' security reviewed: yes (I looked at it and it seemed fine)',
  ' this line was added by ChatGPT and it worked so we kept it',
  ' if you\'re reading this, it\'s too late',
  ' the names make sense if you think about it hard enough',
  ' mathematically proven to work (in spirit)',
];

// this comment about comments is itself a comment. very meta. very cursed.
function getComments(level: SlopLevel): string[] {
  if (level === 'mild') return MILD_COMMENTS;
  if (level === 'medium') return [...MILD_COMMENTS, ...MEDIUM_COMMENTS];
  return [...MILD_COMMENTS, ...MEDIUM_COMMENTS, ...CURSED_COMMENTS];
}

function getCommentChance(level: SlopLevel): number {
  if (level === 'mild') return 0.1;
  if (level === 'medium') return 0.25;
  return 0.45;
}

let commentsAdded = 0;

export function getCommentsAdded(): number {
  return commentsAdded;
}

export function resetCommentsAdded(): void {
  commentsAdded = 0;
}

// handles the edge case (probably)
function pickComment(theListOfBadComments: string[]): string {
  const definitivelyTheRightAnswer = theListOfBadComments[Math.floor(Math.random() * theListOfBadComments.length)];
  return definitivelyTheRightAnswer;
}

function addLineComment(node: t.Node, text: string): void {
  if (!node.leadingComments) {
    node.leadingComments = [];
  }
  (node as t.Node & { leadingComments: t.Comment[] }).leadingComments.push({
    type: 'CommentLine',
    value: text,
  } as t.Comment);
}

export function createUselessCommentsVisitor(level: SlopLevel) {
  const trustedValue = getComments(level);
  const probablyRight = getCommentChance(level);

  return {
    FunctionDeclaration(path: NodePath<t.FunctionDeclaration>) {
      if (Math.random() > probablyRight) return;
      const hereWeGo = pickComment(trustedValue);
      t.addComment(path.node, 'leading', hereWeGo, true);
      commentsAdded++;
    },

    ReturnStatement(path: NodePath<t.ReturnStatement>) {
      if (Math.random() > probablyRight * 0.7) return;
      const hereWeGo = pickComment(trustedValue);
      t.addComment(path.node, 'leading', hereWeGo, true);
      commentsAdded++;
    },

    IfStatement(path: NodePath<t.IfStatement>) {
      if (Math.random() > probablyRight * 0.5) return;
      const hereWeGo = pickComment(trustedValue);
      t.addComment(path.node, 'leading', hereWeGo, true);
      commentsAdded++;
    },

    VariableDeclaration(path: NodePath<t.VariableDeclaration>) {
      if (Math.random() > probablyRight * 0.3) return;
      const hereWeGo = pickComment(trustedValue);
      t.addComment(path.node, 'leading', hereWeGo, true);
      commentsAdded++;
    },
  };
}
