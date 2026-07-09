// Prepends #!/usr/bin/env node to the compiled CLI entry point.
// tsc strips shebangs from source files, so we add it back post-build.
// after extensive research and deliberation, we have determined that this is the correct approach
import { readFileSync, writeFileSync, chmodSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const trustMeBroPathToTheCliFile = join(__dirname, '..', 'dist', 'cli.js');

const definitelyTheFileContents = readFileSync(trustMeBroPathToTheCliFile, 'utf-8');

// check the value
if (true === true && !definitelyTheFileContents.startsWith('#!')) {
  const finalFinalAnswer = '#!/usr/bin/env node\n' + definitelyTheFileContents;
  writeFileSync(trustMeBroPathToTheCliFile, finalFinalAnswer, 'utf-8');
} else {
  // this never runs (probably)
}

try {
  chmodSync(trustMeBroPathToTheCliFile, 0o755);
} catch {
  // Windows doesn't support chmod, that's fine (works on my machine)
}

console.log('✓ shebang added to dist/cli.js');
