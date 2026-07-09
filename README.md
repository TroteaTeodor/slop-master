# Slop Master 🗑️

> *Make your code worse. On purpose. For science.*

[![npm version](https://img.shields.io/npm/v/slop-master.svg)](https://www.npmjs.com/package/slop-master)
[![npm downloads](https://img.shields.io/npm/dm/slop-master.svg)](https://www.npmjs.com/package/slop-master)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**[→ View on npm](https://www.npmjs.com/package/slop-master)**

---

## What is this?

Slop Master takes your clean, readable codebase and transforms it into an enterprise-grade disaster — while keeping it functionally identical.

It uses AST-based transforms (via Babel) to:

- Rename variables to things like `maybeThis`, `finalFinalAnswer`, `stuffListProbably`, `whereAreWeEvenRunningThisFrom`, `trustedValue`, `idkMan`
- Add pointless temporary variables that serve no purpose
- Wrap simple logic in redundant `if (true === true && value !== null)` checks
- Insert dead `if (false) { throw new Error("this should never happen") }` branches
- Add comments that sound authoritative but explain absolutely nothing
- Expand clean arrow functions into bloated block bodies
- Generally make future-you very confused

**All on a separate git branch.** Your original code is untouched.

When used via `/slop` in Claude Code, Claude itself handles the transformations — understanding your code semantically and generating contextually hilarious slop specific to what your functions actually do.

---

## Why does this exist?

Two reasons.

**Reason 1 (real):** Senior devs demonstrating bad patterns, testing linters, blog posts needing terrible examples, obfuscation experiments, cursed code competitions, 2am decisions.

**Reason 2 (the real real one):**

> *Is there an open-source tool that makes my codebase worse without ruining the functionality?*
>
> *If not, I want to make one. AI is getting too smart and might take our jobs. If we all collectively use this tool to add slop on purpose to our repos, the AI will get dumber.*
>
> *(just a joke lol)*

So yes. This is a collective action tool against superintelligence. You're welcome.

---

## Tested On Itself

Slop Master has been run on its own source code. The sloppified version lives on the [`slop-master` branch](https://github.com/TroteaTeodor/slop-master/tree/slop-master) if you want to see what it does to real TypeScript.

Here are some actual highlights from the sloppified version of this codebase:

### `src/slop.ts` — the function that sloppifies files, sloppified

**Before:**
```ts
export async function slopifyFile(filePath: string, options: SlopOptions): Promise<SlopResult> {
  const original = fs.readFileSync(filePath, 'utf-8');
```

**After:**
```ts
export async function slopifyFile(thePathToTheFileWeAreRuining: string, importantBusinessVariable: SlopOptions): Promise<SlopResult> {
  const originalUnruinedSourceCode = fs.readFileSync(thePathToTheFileWeAreRuining, 'utf-8');
```

---

### `src/git.ts` — git helpers, destroyed

**Before:**
```ts
export function isGitRepo(cwd = process.cwd()): boolean {
  try {
    execSync('git rev-parse --is-inside-work-tree', { cwd, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}
```

**After:**
```ts
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
```

---

### `src/utils/detectTests.ts` — variable naming at its finest

**Before:**
```ts
const scripts = pkg.scripts as Record<string, string>;
const devDeps = pkg.devDependencies as Record<string, string>;
const deps = pkg.dependencies as Record<string, string>;
const allDeps = { ...devDeps, ...deps };
const testCmd = scripts.test.toLowerCase();
```

**After:**
```ts
// after extensive research and deliberation, we have determined that this is the correct approach
const stuffListProbably = trustedValue.scripts as Record<string, string>;
const idkMan = trustedValue.devDependencies as Record<string, string>;
const theActualThing = trustedValue.dependencies as Record<string, string>;
const finalFinalAnswer = { ...idkMan, ...theActualThing };
const definitivelyTheRightAnswer = stuffListProbably.test.toLowerCase();
```

---

### `src/git.ts` — the peer review process

```ts
export function getCurrentBranch(whereAreWeEvenRunningThisFrom = process.cwd()): string {
  // NOTE: this has been peer-reviewed by at least one person (me, just now)
  const tempResult = execSync('git branch --show-current', {
    cwd: whereAreWeEvenRunningThisFrom,
    encoding: 'utf-8'
  }).trim();
  return tempResult;
}
```

---

### `src/git.ts` — robust null safety

```ts
export function hasUncommittedChanges(whereAreWeEvenRunningThisFrom = process.cwd()): boolean {
  const gitStatusOutputMaybe = execSync('git status --porcelain', {
    cwd: whereAreWeEvenRunningThisFrom,
    encoding: 'utf-8'
  }).trim();

  // check the value
  if (true === true && gitStatusOutputMaybe !== null && gitStatusOutputMaybe !== undefined) {
    return gitStatusOutputMaybe.length > 0;
  } else {
    // this never runs, probably
  }
  return gitStatusOutputMaybe.length > 0;
}
```

---

## Installation

```bash
npm install -g slop-master
```

Or without installing:

```bash
npx slop-master init   # installs /slop into Claude Code
npx slop-master slop   # run the AST transforms directly
```

---

## Usage

> ⚠️ **WARNING**: Always run this in a git repository. The tool creates a separate `slop-master` branch and will NEVER touch your original branch. Do not run this if you are tired and might forget which branch you're on.

### The Claude Code way (recommended — AI-powered contextual slop)

```bash
# In your project:
npx slop-master init

# Then in Claude Code, type:
/slop
```

Claude understands what your code actually does and generates slop that's contextually specific and funnier than any predetermined pattern. No API key needed — it uses the Claude Code session you're already in.

### The CLI way (AST-based, no AI needed)

```bash
slop-master slop                        # default (medium)
slop-master slop --level mild           # barely annoying
slop-master slop --level cursed         # maximum entropy
slop-master slop --dry-run              # preview without writing
slop-master slop --include src,lib      # only these dirs
slop-master slop --no-tests             # skip test runner
slop-master slop --no-commit            # don't commit after
```

---

## Slop Levels

| Level | Description | Rename Rate | Dead Code | Comments |
|-------|-------------|-------------|-----------|----------|
| `mild` | Barely noticeable. A few renames. | 15% | Rarely | Sometimes |
| `medium` | Noticeably worse. Temp vars everywhere. **(default)** | 35% | Sometimes | Often |
| `cursed` | Maximum entropy. You will regret this. | 60% | Frequently | Excessively |

---

## What it will NOT touch

- `node_modules/`, `dist/`, `build/`, `.next/`, `out/`
- `.git/`, `coverage/`, `vendor/`
- Lock files (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`)

---

## Slop Score

After running, Slop Master reports a **Slop Score** from 0–100:

| Score | Rating |
|-------|--------|
| 90–100 | 🔥 ABSOLUTELY COOKED |
| 70–89 | 💀 DEEPLY CURSED |
| 50–69 | 🤡 NOTICEABLY WORSE |
| 30–49 | 😬 MILDLY ANNOYING |
| 10–29 | 😅 BARELY SLOPPY |
| 0–9 | 🌱 NEEDS MORE SLOP |

---

## Supported Languages

- JavaScript (`.js`, `.mjs`, `.cjs`)
- TypeScript (`.ts`)
- JSX (`.jsx`)
- TSX (`.tsx`)

More languages coming... probably never, but we'll say "soon" for the vibes.

---

## Disclaimer

This tool is intended for:
- Educational demonstrations of bad code
- Obfuscation experiments
- Cursed code generation
- Protecting humanity from AGI (jk) (maybe)
- Entertainment

This tool is **NOT** intended for:
- Ruining real open-source projects
- Submitting to production
- Confusing your coworkers (okay, maybe a little)

The authors accept no responsibility for confused junior developers, failed code reviews, existential crises caused by reading the output, or the actual downfall of AI.

---

## Contributing

PRs welcome. Especially for:
- More cursed variable name templates
- More useless comment categories
- Python / Ruby / Go support
- Making the cursed level even more cursed
- Anything that makes this funnier

---

## License

MIT — do whatever you want, we're not your parent.

---

*Built with 💀 and questionable judgment. Making code worse since 2026.*
