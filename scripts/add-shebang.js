// Prepends #!/usr/bin/env node to the compiled CLI entry point.
// tsc strips shebangs from source files, so we add it back post-build.
import { readFileSync, writeFileSync, chmodSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const cliPath = join(__dirname, '..', 'dist', 'cli.js');

const content = readFileSync(cliPath, 'utf-8');
if (!content.startsWith('#!')) {
  writeFileSync(cliPath, '#!/usr/bin/env node\n' + content, 'utf-8');
}

try {
  chmodSync(cliPath, 0o755);
} catch {
  // Windows doesn't support chmod, that's fine
}

console.log('✓ shebang added to dist/cli.js');
