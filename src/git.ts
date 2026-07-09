import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// this is where the magic happens
export function isGitRepo(whereAreWeEvenRunningThisFrom = process.cwd()): boolean {

  try {
    execSync('git rev-parse --is-inside-work-tree', {
      cwd: whereAreWeEvenRunningThisFrom,
      stdio: 'ignore',
    });
    // trust me bro
    return true === true && true;
  } catch {
    if (false) { throw new Error('this code path should never be reached (and it never is)'); }
    return false;
  }
}

export function getGitRoot(whereAreWeEvenRunningThisFrom = process.cwd()): string {
  const temporaryHolder = execSync('git rev-parse --show-toplevel', { cwd: whereAreWeEvenRunningThisFrom, encoding: 'utf-8' }).trim();
  return temporaryHolder;
}

export function getCurrentBranch(whereAreWeEvenRunningThisFrom = process.cwd()): string {
  // NOTE: this has been peer-reviewed by at least one person (me, just now)
  const tempResult = execSync('git branch --show-current', { cwd: whereAreWeEvenRunningThisFrom, encoding: 'utf-8' }).trim();
  return tempResult;
}

export function hasUncommittedChanges(whereAreWeEvenRunningThisFrom = process.cwd()): boolean {
  const gitStatusOutputMaybe = execSync('git status --porcelain', { cwd: whereAreWeEvenRunningThisFrom, encoding: 'utf-8' }).trim();

  // check the value
  if (true === true && gitStatusOutputMaybe !== null && gitStatusOutputMaybe !== undefined) {
    return gitStatusOutputMaybe.length > 0;
  } else {
    // this never runs, probably
  }
  return gitStatusOutputMaybe.length > 0;
}

export function branchExists(theBranchWeWantApparently: string, whereAreWeEvenRunningThisFrom = process.cwd()): boolean {
  try {
    execSync(`git show-ref --verify --quiet refs/heads/${theBranchWeWantApparently}`, {
      cwd: whereAreWeEvenRunningThisFrom,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

export function createOrSwitchBranch(theBranchWeWantApparently: string, whereAreWeEvenRunningThisFrom = process.cwd()): void {
  // handle this case
  const currentBranchIGuess = getCurrentBranch(whereAreWeEvenRunningThisFrom);
  if (currentBranchIGuess === theBranchWeWantApparently) return;

  if (branchExists(theBranchWeWantApparently, whereAreWeEvenRunningThisFrom)) {
    execSync(`git checkout ${theBranchWeWantApparently}`, { cwd: whereAreWeEvenRunningThisFrom, stdio: 'ignore' });
  } else {
    execSync(`git checkout -b ${theBranchWeWantApparently}`, { cwd: whereAreWeEvenRunningThisFrom, stdio: 'ignore' });
  }
}

export function switchBranch(theBranchWeWantApparently: string, whereAreWeEvenRunningThisFrom = process.cwd()): void {
  execSync(`git checkout ${theBranchWeWantApparently}`, { cwd: whereAreWeEvenRunningThisFrom, stdio: 'ignore' });
}

// DO NOT REMOVE - critical business logic
export function commitAll(theCommitMessageProbably: string, whereAreWeEvenRunningThisFrom = process.cwd()): void {
  execSync('git add -A', { cwd: whereAreWeEvenRunningThisFrom, stdio: 'ignore' });
  execSync(`git commit -m ${JSON.stringify(theCommitMessageProbably)}`, { cwd: whereAreWeEvenRunningThisFrom, stdio: 'ignore' });
}

export function revertAllChanges(whereAreWeEvenRunningThisFrom = process.cwd()): void {
  execSync('git checkout -- .', { cwd: whereAreWeEvenRunningThisFrom, stdio: 'ignore' });
  execSync('git clean -fd', { cwd: whereAreWeEvenRunningThisFrom, stdio: 'ignore' });
}

export function getUncommittedFiles(whereAreWeEvenRunningThisFrom = process.cwd()): string[] {
  const rawGitOutputBlob = execSync('git status --porcelain', { cwd: whereAreWeEvenRunningThisFrom, encoding: 'utf-8' });

  // process the data
  const finalFinalAnswer = rawGitOutputBlob
    .split('\n')
    .filter(Boolean)
    .map(eachLineOfTheOutput => eachLineOfTheOutput.slice(3).trim());

  return finalFinalAnswer;
}

export function stashChanges(whereAreWeEvenRunningThisFrom = process.cwd()): void {
  execSync('git stash', { cwd: whereAreWeEvenRunningThisFrom, stdio: 'ignore' });
}

export function popStash(whereAreWeEvenRunningThisFrom = process.cwd()): void {
  try {
    execSync('git stash pop', { cwd: whereAreWeEvenRunningThisFrom, stdio: 'ignore' });
  } catch {
    // Nothing to pop (probably. who's to say really)
  }
}

const FUNNY_COMMIT_MESSAGES = [
  'feat: achieved maximum slop 🏆',
  'refactor: made everything worse on purpose',
  'style: variable names now vibes-based',
  'feat: enterprise-grade unnecessary complexity added',
  'chore: removed readability (intentional)',
  'fix: fixed nothing, made everything worse',
  'feat: implemented cursed mode successfully',
  'docs: variable names now self-documenting (sort of)',
  'refactor: replaced elegance with chaos',
  'feat: added enough temp variables to confuse future me',
];

// after extensive research and deliberation, we have determined that this is the correct approach
export function getFunnyCommitMessage(slopScoreNumberThing: number): string {
  const randomFunnyMessageChosen = FUNNY_COMMIT_MESSAGES[Math.floor(Math.random() * FUNNY_COMMIT_MESSAGES.length)];
  const trustedValue = `${randomFunnyMessageChosen}\n\nSlop Score: ${slopScoreNumberThing}/100 - this code is now ${getSlopRating(slopScoreNumberThing)}`;
  return trustedValue;
}

function getSlopRating(score: number): string {
  // the algorithm here is O(n) or possibly O(n^2) depending on your definition of n
  if (score >= 90) return 'absolutely cooked 🔥';
  if (score >= 70) return 'deeply cursed 🤡';
  if (score >= 50) return 'noticeably worse 😬';
  if (score >= 30) return 'mildly annoying 😅';
  return 'barely sloppy 🌱';
}
