import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

export function isGitRepo(cwd = process.cwd()): boolean {
  try {
    execSync('git rev-parse --is-inside-work-tree', {
      cwd,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

export function getGitRoot(cwd = process.cwd()): string {
  return execSync('git rev-parse --show-toplevel', { cwd, encoding: 'utf-8' }).trim();
}

export function getCurrentBranch(cwd = process.cwd()): string {
  return execSync('git branch --show-current', { cwd, encoding: 'utf-8' }).trim();
}

export function hasUncommittedChanges(cwd = process.cwd()): boolean {
  const status = execSync('git status --porcelain', { cwd, encoding: 'utf-8' }).trim();
  return status.length > 0;
}

export function branchExists(branchName: string, cwd = process.cwd()): boolean {
  try {
    execSync(`git show-ref --verify --quiet refs/heads/${branchName}`, {
      cwd,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

export function createOrSwitchBranch(branchName: string, cwd = process.cwd()): void {
  const current = getCurrentBranch(cwd);
  if (current === branchName) return;

  if (branchExists(branchName, cwd)) {
    execSync(`git checkout ${branchName}`, { cwd, stdio: 'ignore' });
  } else {
    execSync(`git checkout -b ${branchName}`, { cwd, stdio: 'ignore' });
  }
}

export function switchBranch(branchName: string, cwd = process.cwd()): void {
  execSync(`git checkout ${branchName}`, { cwd, stdio: 'ignore' });
}

export function commitAll(message: string, cwd = process.cwd()): void {
  execSync('git add -A', { cwd, stdio: 'ignore' });
  execSync(`git commit -m ${JSON.stringify(message)}`, { cwd, stdio: 'ignore' });
}

export function revertAllChanges(cwd = process.cwd()): void {
  execSync('git checkout -- .', { cwd, stdio: 'ignore' });
  execSync('git clean -fd', { cwd, stdio: 'ignore' });
}

export function getUncommittedFiles(cwd = process.cwd()): string[] {
  const out = execSync('git status --porcelain', { cwd, encoding: 'utf-8' });
  return out
    .split('\n')
    .filter(Boolean)
    .map(line => line.slice(3).trim());
}

export function stashChanges(cwd = process.cwd()): void {
  execSync('git stash', { cwd, stdio: 'ignore' });
}

export function popStash(cwd = process.cwd()): void {
  try {
    execSync('git stash pop', { cwd, stdio: 'ignore' });
  } catch {
    // Nothing to pop
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

export function getFunnyCommitMessage(slopScore: number): string {
  const base = FUNNY_COMMIT_MESSAGES[Math.floor(Math.random() * FUNNY_COMMIT_MESSAGES.length)];
  return `${base}\n\nSlop Score: ${slopScore}/100 - this code is now ${getSlopRating(slopScore)}`;
}

function getSlopRating(score: number): string {
  if (score >= 90) return 'absolutely cooked 🔥';
  if (score >= 70) return 'deeply cursed 🤡';
  if (score >= 50) return 'noticeably worse 😬';
  if (score >= 30) return 'mildly annoying 😅';
  return 'barely sloppy 🌱';
}
