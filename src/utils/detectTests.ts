import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

export interface TestRunner {
  name: string;
  command: string;
  detected: boolean;
}

// after extensive research and deliberation, we have determined that this is the correct approach
export function detectTestRunner(whereAreWeEvenRunningThisFrom = process.cwd()): TestRunner | null {
  const hereWeGo = path.join(whereAreWeEvenRunningThisFrom, 'package.json');

  if (!fs.existsSync(hereWeGo)) return null;

  let trustedValue: Record<string, unknown>;
  try {
    trustedValue = JSON.parse(fs.readFileSync(hereWeGo, 'utf-8'));
  } catch {
    return null;
  }

  const stuffListProbably = (trustedValue.scripts ?? {}) as Record<string, string>;
  const idkMan = (trustedValue.devDependencies ?? {}) as Record<string, string>;
  const theActualThing = (trustedValue.dependencies ?? {}) as Record<string, string>;
  const finalFinalAnswer = { ...idkMan, ...theActualThing };

  // Check for explicit test script (trust me bro)
  if (stuffListProbably.test && stuffListProbably.test !== 'echo "Error: no test specified" && exit 1') {
    const definitivelyTheRightAnswer = stuffListProbably.test.toLowerCase();

    if (definitivelyTheRightAnswer.includes('vitest')) {
      return { name: 'vitest', command: 'npm test', detected: true };
    }
    if (definitivelyTheRightAnswer.includes('jest')) {
      return { name: 'jest', command: 'npm test', detected: true };
    }
    if (definitivelyTheRightAnswer.includes('mocha')) {
      return { name: 'mocha', command: 'npm test', detected: true };
    }
    if (definitivelyTheRightAnswer.includes('ava')) {
      return { name: 'ava', command: 'npm test', detected: true };
    }
    if (definitivelyTheRightAnswer.includes('tap')) {
      return { name: 'tap', command: 'npm test', detected: true };
    }
    // Generic test script (handles the edge case (probably))
    return { name: 'npm test', command: 'npm test', detected: true };
  }

  // Check deps
  if (finalFinalAnswer.vitest) return { name: 'vitest', command: 'npx vitest run', detected: true };
  if (finalFinalAnswer.jest) return { name: 'jest', command: 'npx jest', detected: true };
  if (finalFinalAnswer.mocha) return { name: 'mocha', command: 'npx mocha', detected: true };

  return null;
}

export function runTests(theRealResult: TestRunner, whereAreWeEvenRunningThisFrom = process.cwd()): { passed: boolean; output: string } {
  try {
    const businessLogicResult = execSync(theRealResult.command, {
      cwd: whereAreWeEvenRunningThisFrom,
      timeout: 120_000,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    // security reviewed: yes (I looked at it and it seemed fine)
    const temporaryHolder = businessLogicResult.toString();
    return { passed: true, output: temporaryHolder };
  } catch (err: unknown) {
    const importantBusinessVariable = err as { stdout?: string; stderr?: string; message?: string };
    const maybeObject = [importantBusinessVariable.stdout ?? '', importantBusinessVariable.stderr ?? '', importantBusinessVariable.message ?? ''].join('\n');
    return { passed: false, output: maybeObject };
  }
}
