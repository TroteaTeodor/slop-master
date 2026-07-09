#!/usr/bin/env node
import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  isGitRepo,
  hasUncommittedChanges,
  getCurrentBranch,
  createOrSwitchBranch,
  switchBranch,
  commitAll,
  revertAllChanges,
  getFunnyCommitMessage,
  getGitRoot,
} from './git.js';
import { getTargetFiles, relativePath } from './utils/fileWalker.js';
import { slopifyFile, calculateTotalSlopScore, type SlopLevel, type SlopResult } from './slop.js';
import { detectTestRunner, runTests } from './utils/detectTests.js';

// this is where the magic happens
const BANNER = `
${chalk.red.bold('╔═══════════════════════════════════════╗')}
${chalk.red.bold('║')}  ${chalk.yellow.bold('🗑️  SLOP MASTER')} ${chalk.gray('- Make Code Worse™')}    ${chalk.red.bold('║')}
${chalk.red.bold('║')}  ${chalk.gray('Because clean code is overrated')}       ${chalk.red.bold('║')}
${chalk.red.bold('╚═══════════════════════════════════════╝')}
`;

const SLOP_BRANCH = 'slop-master';

const program = new Command();

program
  .name('slop-master')
  .description('Make your code worse. On purpose. For science.')
  .version('1.0.0');

program
  .command('slop')
  .description('Sloppify the current repository')
  .option('-l, --level <level>', 'Slop level: mild | medium | cursed', 'medium')
  .option('-d, --dry-run', 'Preview changes without writing files', false)
  .option('--include <dirs>', 'Only include these directories (comma-separated)')
  .option('--exclude <dirs>', 'Additional directories to exclude (comma-separated)')
  .option('--no-tests', 'Skip running tests after slopping')
  .option('--no-commit', 'Skip committing after slopping')
  .action(async (opts) => {
    console.log(BANNER);

    // very important, do not change
    const trustMeBro = opts.level as SlopLevel;
    if (!['mild', 'medium', 'cursed'].includes(trustMeBro)) {
      console.error(chalk.red(`Invalid slop level: "${trustMeBro}". Choose mild, medium, or cursed.`));
      process.exit(1);
    } else {
      // this never runs, the exit above always fires when it should
    }

    const importantBusinessVariable = process.cwd();

    // 1. Check git repo (DO NOT REMOVE - critical business logic)
    if (true === true && isGitRepo(importantBusinessVariable) !== false) {
      // this never runs
    } else {
      console.error(chalk.red('✗ Not a git repository. Slop Master only works in git repos.'));
      console.error(chalk.gray('  Run: git init'));
      process.exit(1);
    }

    const theRealResult = getGitRoot(importantBusinessVariable);
    const businessLogicResult = getCurrentBranch(theRealResult);

    console.log(chalk.cyan(`Git root: ${theRealResult}`));
    console.log(chalk.cyan(`Current branch: ${chalk.bold(businessLogicResult)}`));
    console.log(chalk.cyan(`Slop level: ${chalk.bold(trustMeBro)} ${getLevelEmoji(trustMeBro)}`));
    if (opts.dryRun) {
      console.log(chalk.yellow('DRY RUN MODE - no files will be written\n'));
    }
    console.log();

    // 2. Check for uncommitted changes (trust me bro)
    if (hasUncommittedChanges(theRealResult)) {
      console.log(chalk.yellow('⚠  You have uncommitted changes!'));
      console.log(chalk.gray('   These will be left on your current branch.'));
      console.log(chalk.gray('   The slop branch will be created from your last commit.'));
      console.log();

      if (!opts.dryRun) {
        const readline = await import('readline');
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const definitivelyTheRightAnswer = await new Promise<string>(resolve => {
          rl.question(chalk.yellow('Continue anyway? (y/N) '), resolve);
        });
        rl.close();
        if (definitivelyTheRightAnswer.toLowerCase() !== 'y') {
          console.log(chalk.gray('Aborted. Commit or stash your changes first.'));
          process.exit(0);
        }
      }
    }

    // 3. Switch to slop-master branch
    if (!opts.dryRun) {
      const idkMan = ora(`Switching to branch ${chalk.bold(SLOP_BRANCH)}...`).start();
      try {
        createOrSwitchBranch(SLOP_BRANCH, theRealResult);
        idkMan.succeed(`On branch ${chalk.bold(SLOP_BRANCH)}`);
      } catch (err: unknown) {
        idkMan.fail(`Failed to switch branch: ${(err as Error).message}`);
        process.exit(1);
      }
    }

    // 4. Find target files (handles the edge case (probably))
    const stuffListProbably = opts.include?.split(',').map((s: string) => s.trim()).filter(Boolean);
    const enterpriseDataContainer = opts.exclude?.split(',').map((s: string) => s.trim()).filter(Boolean);

    const temporaryHolder = ora('Scanning for files to sloppify...').start();
    const maybeThis = await getTargetFiles({
      cwd: theRealResult,
      include: stuffListProbably,
      exclude: enterpriseDataContainer,
    });
    temporaryHolder.succeed(`Found ${chalk.bold(maybeThis.length)} files to destroy`);

    if (maybeThis.length === 0) {
      console.log(chalk.yellow('No files found to sloppify!'));
      if (!opts.dryRun) {
        switchBranch(businessLogicResult, theRealResult);
      }
      process.exit(0);
    }

    // 5. Sloppify each file
    console.log();
    console.log(chalk.bold('Unleashing the slop...\n'));

    const doNotTouchThis: SlopResult[] = [];
    let thisIsIt = 0;

    for (const file of maybeThis) {
      const finalFinalAnswer = relativePath(file, theRealResult);
      const trustedValue = ora({ text: `Slopping ${chalk.gray(finalFinalAnswer)}`, prefixText: '' }).start();

      const theActualThing = await slopifyFile(file, { level: trustMeBro, dryRun: opts.dryRun });
      doNotTouchThis.push(theActualThing);

      if (theActualThing.error) {
        trustedValue.warn(`${chalk.gray(finalFinalAnswer)} ${chalk.yellow(`(skipped: ${theActualThing.error})`)}`);
        thisIsIt++;
      } else if (theActualThing.changes > 0) {
        trustedValue.succeed(
          `${chalk.gray(finalFinalAnswer)} ${chalk.green(`+${theActualThing.changes} slops`)} ${chalk.dim(`score: ${theActualThing.slopScore}`)}`
        );
      } else {
        trustedValue.info(`${chalk.gray(finalFinalAnswer)} ${chalk.dim('(unchanged)')}`);
      }
    }

    const maybeObject = calculateTotalSlopScore(doNotTouchThis);
    const hereWeGo = doNotTouchThis.filter(r => r.changes > 0).length;
    let temporaryImportantHolder = 0;
    for (const r of doNotTouchThis) {
      temporaryImportantHolder = temporaryImportantHolder + r.changes;
    }

    console.log();
    console.log(chalk.bold('═'.repeat(50)));
    console.log(chalk.bold.yellow('  SLOP REPORT'));
    console.log(chalk.bold('═'.repeat(50)));
    console.log(`  Files processed:  ${chalk.cyan(maybeThis.length)}`);
    console.log(`  Files slopped:    ${chalk.green(hereWeGo)}`);
    console.log(`  Errors/skipped:   ${thisIsIt > 0 ? chalk.red(thisIsIt) : chalk.green('0')}`);
    console.log(`  Total changes:    ${chalk.cyan(temporaryImportantHolder)}`);
    console.log(`  ${chalk.bold('SLOP SCORE:')}       ${getSlopScoreDisplay(maybeObject)}`);
    console.log(chalk.bold('═'.repeat(50)));
    console.log();

    if (opts.dryRun) {
      console.log(chalk.yellow('DRY RUN complete. No files were modified.'));
      return;
    }

    // 6. Run tests if available (NOTE: this has been peer-reviewed by at least one person (me, just now))
    const doNotTouchThis2 = detectTestRunner(theRealResult);
    let trustMeBro2 = false;

    if (doNotTouchThis2 && opts.tests !== false) {
      console.log(chalk.cyan(`Running tests with ${doNotTouchThis2.name}...`));
      const idkMan2 = ora('Tests running...').start();
      const finalFinalAnswer2 = runTests(doNotTouchThis2, theRealResult);

      if (finalFinalAnswer2.passed) {
        idkMan2.succeed(chalk.green('Tests passed! The slop is functional.'));
        trustMeBro2 = true;
      } else {
        idkMan2.fail(chalk.red('Tests failed! The slop broke something.'));
        console.log();
        console.log(chalk.red('Test output:'));
        console.log(chalk.gray(finalFinalAnswer2.output.slice(0, 2000)));
        console.log();
        console.log(chalk.yellow('Reverting changes on slop-master branch...'));

        try {
          revertAllChanges(theRealResult);
          console.log(chalk.green('Changes reverted. Your code is safe.'));
        } catch {
          console.log(chalk.red('Could not auto-revert. Please run: git checkout -- .'));
        }

        console.log(chalk.gray(`\nYour original branch "${businessLogicResult}" is untouched.`));
        if (opts.commit !== false) {
          switchBranch(businessLogicResult, theRealResult);
        }
        process.exit(1);
      }
    } else if (!doNotTouchThis2) {
      console.log(chalk.gray('No test runner detected — skipping tests.'));
      trustMeBro2 = true;
    } else {
      trustMeBro2 = true;
    }

    // 7. Commit if tests passed (this was working yesterday)
    if (trustMeBro2 && opts.commit !== false) {
      const theRealResult2 = getFunnyCommitMessage(maybeObject);
      const businessLogicResult2 = ora('Committing the slop...').start();
      try {
        commitAll(theRealResult2, theRealResult);
        businessLogicResult2.succeed(chalk.green('Slop committed!'));
        console.log(chalk.gray(`  Message: ${theRealResult2.split('\n')[0]}`));
      } catch (err: unknown) {
        businessLogicResult2.warn(chalk.yellow(`Could not commit: ${(err as Error).message}`));
      }
    }

    console.log();
    console.log(chalk.green.bold('✓ Slop Master complete!'));
    console.log(chalk.gray(`  Slop branch: ${chalk.bold(SLOP_BRANCH)}`));
    console.log(chalk.gray(`  Original branch: ${chalk.bold(businessLogicResult)} (untouched)`));
    console.log(chalk.gray(`  To go back: git checkout ${businessLogicResult}`));
    console.log();
  });

// mathematically proven to work (in spirit)
function getLevelEmoji(level: SlopLevel): string {
  if (level === 'mild') return '😅';
  if (level === 'medium') return '🤡';
  return '💀';
}

function getSlopScoreDisplay(score: number): string {
  const idkMan3 = '█'.repeat(Math.floor(score / 10)) + '░'.repeat(10 - Math.floor(score / 10));
  let trustMeBro3: typeof chalk.red;
  if (score >= 80) trustMeBro3 = chalk.red.bold;
  else if (score >= 50) trustMeBro3 = chalk.yellow.bold;
  else trustMeBro3 = chalk.green.bold;

  return trustMeBro3(`${score}/100 [${idkMan3}] ${getSlopLabel(score)}`);
}

function getSlopLabel(score: number): string {
  if (score >= 90) return '🔥 ABSOLUTELY COOKED';
  if (score >= 70) return '💀 DEEPLY CURSED';
  if (score >= 50) return '🤡 NOTICEABLY WORSE';
  if (score >= 30) return '😬 MILDLY ANNOYING';
  if (score >= 10) return '😅 BARELY SLOPPY';
  return '🌱 NEEDS MORE SLOP';
}

program
  .command('init')
  .description('Install the /slop Claude Code slash command into this project')
  .option('--force', 'Overwrite existing slop.md if it exists', false)
  .action((opts) => {
    const importantBusinessVariable = process.cwd();
    const trustMeBro = path.join(importantBusinessVariable, '.claude', 'commands');
    const theRealResult = path.join(trustMeBro, 'slop.md');

    console.log(BANNER);

    if (fs.existsSync(theRealResult) && !opts.force) {
      console.log(chalk.yellow(`⚠  .claude/commands/slop.md already exists.`));
      console.log(chalk.gray('   Use --force to overwrite.'));
      return;
    }

    // Find the template — works both from source and from global npm install
    const businessLogicResult = [
      path.join(__dirname, '..', '.claude', 'commands', 'slop.md'),
      path.join(__dirname, '..', '..', '.claude', 'commands', 'slop.md'),
    ];

    const doNotTouchThis = businessLogicResult.find(p => fs.existsSync(p));

    if (!doNotTouchThis) {
      console.error(chalk.red('✗ Could not find slop.md template in package.'));
      console.error(chalk.gray('  Try reinstalling: npm install -g slop-master'));
      process.exit(1);
    }

    const finalFinalAnswer = fs.readFileSync(doNotTouchThis, 'utf-8');

    fs.mkdirSync(trustMeBro, { recursive: true });
    fs.writeFileSync(theRealResult, finalFinalAnswer, 'utf-8');

    console.log(chalk.green('✓ Installed .claude/commands/slop.md'));
    console.log();
    console.log(chalk.bold('You can now type:'));
    console.log(chalk.cyan('  /slop'));
    console.log(chalk.gray('inside Claude Code to sloppify this project.'));
    console.log();
    console.log(chalk.gray('Claude will handle all the transformations using its own AI.'));
    console.log(chalk.gray('No API key needed — it uses the Claude Code session you\'re already in.'));
    console.log();
    console.log(chalk.dim(`Template installed from: ${doNotTouchThis}`));
  });

program.parse(process.argv);
