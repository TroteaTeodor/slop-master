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

    const level = opts.level as SlopLevel;
    if (!['mild', 'medium', 'cursed'].includes(level)) {
      console.error(chalk.red(`Invalid slop level: "${level}". Choose mild, medium, or cursed.`));
      process.exit(1);
    }

    const cwd = process.cwd();

    // 1. Check git repo
    if (!isGitRepo(cwd)) {
      console.error(chalk.red('✗ Not a git repository. Slop Master only works in git repos.'));
      console.error(chalk.gray('  Run: git init'));
      process.exit(1);
    }

    const gitRoot = getGitRoot(cwd);
    const originalBranch = getCurrentBranch(gitRoot);

    console.log(chalk.cyan(`Git root: ${gitRoot}`));
    console.log(chalk.cyan(`Current branch: ${chalk.bold(originalBranch)}`));
    console.log(chalk.cyan(`Slop level: ${chalk.bold(level)} ${getLevelEmoji(level)}`));
    if (opts.dryRun) {
      console.log(chalk.yellow('DRY RUN MODE - no files will be written\n'));
    }
    console.log();

    // 2. Check for uncommitted changes
    if (hasUncommittedChanges(gitRoot)) {
      console.log(chalk.yellow('⚠  You have uncommitted changes!'));
      console.log(chalk.gray('   These will be left on your current branch.'));
      console.log(chalk.gray('   The slop branch will be created from your last commit.'));
      console.log();

      if (!opts.dryRun) {
        const readline = await import('readline');
        const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
        const answer = await new Promise<string>(resolve => {
          rl.question(chalk.yellow('Continue anyway? (y/N) '), resolve);
        });
        rl.close();
        if (answer.toLowerCase() !== 'y') {
          console.log(chalk.gray('Aborted. Commit or stash your changes first.'));
          process.exit(0);
        }
      }
    }

    // 3. Switch to slop-master branch
    if (!opts.dryRun) {
      const spinner = ora(`Switching to branch ${chalk.bold(SLOP_BRANCH)}...`).start();
      try {
        createOrSwitchBranch(SLOP_BRANCH, gitRoot);
        spinner.succeed(`On branch ${chalk.bold(SLOP_BRANCH)}`);
      } catch (err: unknown) {
        spinner.fail(`Failed to switch branch: ${(err as Error).message}`);
        process.exit(1);
      }
    }

    // 4. Find target files
    const includeList = opts.include?.split(',').map((s: string) => s.trim()).filter(Boolean);
    const excludeList = opts.exclude?.split(',').map((s: string) => s.trim()).filter(Boolean);

    const spinner = ora('Scanning for files to sloppify...').start();
    const files = await getTargetFiles({
      cwd: gitRoot,
      include: includeList,
      exclude: excludeList,
    });
    spinner.succeed(`Found ${chalk.bold(files.length)} files to destroy`);

    if (files.length === 0) {
      console.log(chalk.yellow('No files found to sloppify!'));
      if (!opts.dryRun) {
        switchBranch(originalBranch, gitRoot);
      }
      process.exit(0);
    }

    // 5. Sloppify each file
    console.log();
    console.log(chalk.bold('Unleashing the slop...\n'));

    const results: SlopResult[] = [];
    let errorCount = 0;

    for (const file of files) {
      const rel = relativePath(file, gitRoot);
      const fileSpinner = ora({ text: `Slopping ${chalk.gray(rel)}`, prefixText: '' }).start();

      const result = await slopifyFile(file, { level, dryRun: opts.dryRun });
      results.push(result);

      if (result.error) {
        fileSpinner.warn(`${chalk.gray(rel)} ${chalk.yellow(`(skipped: ${result.error})`)}`);
        errorCount++;
      } else if (result.changes > 0) {
        fileSpinner.succeed(
          `${chalk.gray(rel)} ${chalk.green(`+${result.changes} slops`)} ${chalk.dim(`score: ${result.slopScore}`)}`
        );
      } else {
        fileSpinner.info(`${chalk.gray(rel)} ${chalk.dim('(unchanged)')}`);
      }
    }

    const totalScore = calculateTotalSlopScore(results);
    const successCount = results.filter(r => r.changes > 0).length;
    const totalChanges = results.reduce((s, r) => s + r.changes, 0);

    console.log();
    console.log(chalk.bold('═'.repeat(50)));
    console.log(chalk.bold.yellow('  SLOP REPORT'));
    console.log(chalk.bold('═'.repeat(50)));
    console.log(`  Files processed:  ${chalk.cyan(files.length)}`);
    console.log(`  Files slopped:    ${chalk.green(successCount)}`);
    console.log(`  Errors/skipped:   ${errorCount > 0 ? chalk.red(errorCount) : chalk.green('0')}`);
    console.log(`  Total changes:    ${chalk.cyan(totalChanges)}`);
    console.log(`  ${chalk.bold('SLOP SCORE:')}       ${getSlopScoreDisplay(totalScore)}`);
    console.log(chalk.bold('═'.repeat(50)));
    console.log();

    if (opts.dryRun) {
      console.log(chalk.yellow('DRY RUN complete. No files were modified.'));
      return;
    }

    // 6. Run tests if available
    const testRunner = detectTestRunner(gitRoot);
    let testsPassed = false;

    if (testRunner && opts.tests !== false) {
      console.log(chalk.cyan(`Running tests with ${testRunner.name}...`));
      const testSpinner = ora('Tests running...').start();
      const testResult = runTests(testRunner, gitRoot);

      if (testResult.passed) {
        testSpinner.succeed(chalk.green('Tests passed! The slop is functional.'));
        testsPassed = true;
      } else {
        testSpinner.fail(chalk.red('Tests failed! The slop broke something.'));
        console.log();
        console.log(chalk.red('Test output:'));
        console.log(chalk.gray(testResult.output.slice(0, 2000)));
        console.log();
        console.log(chalk.yellow('Reverting changes on slop-master branch...'));

        try {
          revertAllChanges(gitRoot);
          console.log(chalk.green('Changes reverted. Your code is safe.'));
        } catch {
          console.log(chalk.red('Could not auto-revert. Please run: git checkout -- .'));
        }

        console.log(chalk.gray(`\nYour original branch "${originalBranch}" is untouched.`));
        if (opts.commit !== false) {
          switchBranch(originalBranch, gitRoot);
        }
        process.exit(1);
      }
    } else if (!testRunner) {
      console.log(chalk.gray('No test runner detected — skipping tests.'));
      testsPassed = true;
    } else {
      testsPassed = true;
    }

    // 7. Commit if tests passed
    if (testsPassed && opts.commit !== false) {
      const commitMsg = getFunnyCommitMessage(totalScore);
      const commitSpinner = ora('Committing the slop...').start();
      try {
        commitAll(commitMsg, gitRoot);
        commitSpinner.succeed(chalk.green('Slop committed!'));
        console.log(chalk.gray(`  Message: ${commitMsg.split('\n')[0]}`));
      } catch (err: unknown) {
        commitSpinner.warn(chalk.yellow(`Could not commit: ${(err as Error).message}`));
      }
    }

    console.log();
    console.log(chalk.green.bold('✓ Slop Master complete!'));
    console.log(chalk.gray(`  Slop branch: ${chalk.bold(SLOP_BRANCH)}`));
    console.log(chalk.gray(`  Original branch: ${chalk.bold(originalBranch)} (untouched)`));
    console.log(chalk.gray(`  To go back: git checkout ${originalBranch}`));
    console.log();
  });

function getLevelEmoji(level: SlopLevel): string {
  if (level === 'mild') return '😅';
  if (level === 'medium') return '🤡';
  return '💀';
}

function getSlopScoreDisplay(score: number): string {
  const bar = '█'.repeat(Math.floor(score / 10)) + '░'.repeat(10 - Math.floor(score / 10));
  let color: typeof chalk.red;
  if (score >= 80) color = chalk.red.bold;
  else if (score >= 50) color = chalk.yellow.bold;
  else color = chalk.green.bold;

  return color(`${score}/100 [${bar}] ${getSlopLabel(score)}`);
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
    const cwd = process.cwd();
    const targetDir = path.join(cwd, '.claude', 'commands');
    const targetFile = path.join(targetDir, 'slop.md');

    console.log(BANNER);

    if (fs.existsSync(targetFile) && !opts.force) {
      console.log(chalk.yellow(`⚠  .claude/commands/slop.md already exists.`));
      console.log(chalk.gray('   Use --force to overwrite.'));
      return;
    }

    // Find the template — works both from source and from global npm install
    const candidates = [
      path.join(__dirname, '..', '.claude', 'commands', 'slop.md'),
      path.join(__dirname, '..', '..', '.claude', 'commands', 'slop.md'),
    ];

    const templatePath = candidates.find(p => fs.existsSync(p));

    if (!templatePath) {
      console.error(chalk.red('✗ Could not find slop.md template in package.'));
      console.error(chalk.gray('  Try reinstalling: npm install -g slop-master'));
      process.exit(1);
    }

    const content = fs.readFileSync(templatePath, 'utf-8');

    fs.mkdirSync(targetDir, { recursive: true });
    fs.writeFileSync(targetFile, content, 'utf-8');

    console.log(chalk.green('✓ Installed .claude/commands/slop.md'));
    console.log();
    console.log(chalk.bold('You can now type:'));
    console.log(chalk.cyan('  /slop'));
    console.log(chalk.gray('inside Claude Code to sloppify this project.'));
    console.log();
    console.log(chalk.gray('Claude will handle all the transformations using its own AI.'));
    console.log(chalk.gray('No API key needed — it uses the Claude Code session you\'re already in.'));
    console.log();
    console.log(chalk.dim(`Template installed from: ${templatePath}`));
  });

program.parse(process.argv);
