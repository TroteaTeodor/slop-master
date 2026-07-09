# Slop Master 🗑️

> *Make your code worse. On purpose. For science.*

[![npm version](https://img.shields.io/npm/v/slop-master.svg)](https://www.npmjs.com/package/slop-master)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## What is this?

Slop Master is a CLI tool that takes your clean, readable codebase and transforms it into an enterprise-grade disaster — while (trying to) keep it functionally identical.

It uses AST-based transforms (via Babel) to:

- Rename your clean variables to `maybeThis`, `finalFinalAnswer`, `temporaryImportantHolder`, and other cursed alternatives
- Add pointless temporary variables that serve no purpose
- Wrap simple logic in redundant `if (true === true)` checks
- Insert dead code branches that never execute
- Add comments that sound authoritative but explain nothing
- Expand arrow functions into bloated block bodies
- Generally make future-you very confused

**All on a separate git branch.** Your original code is untouched.

---

## Why does this exist?

Because:

- Senior devs want to demonstrate what NOT to do (with real examples)
- You want to test if your linters actually catch bad patterns
- You're writing a blog post about code quality and need a terrible example
- You want to submit cursed code to cursed code competitions
- You found this at 2am and decided this is exactly what you needed
- The universe demanded it

---

## Installation

```bash
npm install -g slop-master
```

Or use without installing:

```bash
npx slop-master slop
```

---

## Usage

> ⚠️ **WARNING**: Always run this in a git repository. The tool creates a separate `slop-master` branch and will NOT touch your original branch. Do not run this on a shared branch. Do not run this if you are tired and might forget which branch you're on.

```bash
# Default slop (medium level)
slop-master slop

# Choose your poison
slop-master slop --level mild
slop-master slop --level medium
slop-master slop --level cursed

# Preview without writing
slop-master slop --dry-run

# Only slop specific directories
slop-master slop --include src,lib

# Exclude extra directories
slop-master slop --exclude tests,fixtures

# Skip running tests
slop-master slop --no-tests

# Slop but don't commit
slop-master slop --no-commit
```

---

## Slop Levels

| Level | Description | Rename Rate | Dead Code | Comments |
|-------|-------------|-------------|-----------|----------|
| `mild` | Barely noticeable. A few variable renames. | 15% | Rarely | Sometimes |
| `medium` | Noticeably worse. Temp vars everywhere. **(default)** | 35% | Sometimes | Often |
| `cursed` | Maximum entropy. You will regret this. | 60% | Frequently | Excessively |

---

## Example

**Before:**
```js
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

**After (cursed level):**
```js
// after extensive research and deliberation, we have determined that this is the correct approach
function doTheThingWithStuff(stuffListProbably) {
  // this is where the magic happens
  let finalFinalAnswer = 0;
  const temporaryImportantHolder = stuffListProbably;

  // DO NOT REMOVE - critical business logic
  for (let i = 0; i < temporaryImportantHolder.length; i++) {
    const maybeObject = temporaryImportantHolder[i];

    if (true === true && maybeObject !== null) {
      finalFinalAnswer = finalFinalAnswer + maybeObject.price;
    } else {
      // this should never happen
      console.log('this should never happen');
    }
  }

  if (false) {
    throw new Error('this code path should never be reached (and it never is)');
  }

  // trust me bro
  const theRealResult = finalFinalAnswer;
  return theRealResult;
}
```

---

## What it will NOT touch

- `node_modules/`
- `dist/`, `build/`, `.next/`, `out/`
- `.git/`
- `coverage/`
- `vendor/`
- Lock files (`package-lock.json`, `pnpm-lock.yaml`, `yarn.lock`)

---

## Using with Claude Code (`/slop`)

If you have Slop Master's `.claude/commands/slop.md` in your project, you can type `/slop` directly in Claude Code and it will run the full slop pipeline.

To set this up, copy `.claude/commands/slop.md` into your project's `.claude/commands/` directory.

---

## How it works

1. Parses your JS/TS files into an AST using Babel
2. Runs a series of transform visitors over the AST
3. Generates new code from the modified AST
4. Writes files only to the `slop-master` branch
5. Runs your test suite to verify nothing broke
6. Commits with a funny message if tests pass
7. Auto-reverts if tests fail

---

## Slop Score

After running, Slop Master reports a **Slop Score** from 0-100:

| Score | Rating |
|-------|--------|
| 90-100 | 🔥 ABSOLUTELY COOKED |
| 70-89 | 💀 DEEPLY CURSED |
| 50-69 | 🤡 NOTICEABLY WORSE |
| 30-49 | 😬 MILDLY ANNOYING |
| 10-29 | 😅 BARELY SLOPPY |
| 0-9 | 🌱 NEEDS MORE SLOP |

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
- Demos and presentations
- Entertainment

This tool is **NOT** intended for:
- Ruining real open-source projects
- Submitting to production
- Confusing your coworkers (okay, maybe a little)
- Any use case where functional correctness actually matters

The authors accept no responsibility for confused junior developers, failed code reviews, or existential crises caused by reading slop-master output.

---

## Contributing

PRs welcome. Especially for:
- More cursed variable names
- More useless comment templates
- Python/Ruby/Go support
- Making the cursed level even more cursed

---

## License

MIT — do whatever you want, we're not your parent.

---

*Built with 💀 and questionable judgment.*
