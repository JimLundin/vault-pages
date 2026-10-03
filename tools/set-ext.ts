// Switch a note between .md and .mdx and rewrite every link to it (core/rename.ts). The move is a `git mv`,
// so git keeps it as a rename; the rewritten files are written over the tree.
// Usage: node tools/set-ext.ts "Note Name" mdx|md [--vault <dir>] (default the working directory)
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import type { Change } from '../core/vault.ts';
import { renameNote } from '../core/rename.ts';
import { readVaultFiles, vaultArg } from './fs.ts';

const [name, ext] = process.argv
  .slice(2)
  .filter((a, i, all) => a !== '--vault' && all[i - 1] !== '--vault');
if (!(name && ['md', 'mdx'].includes(ext))) {
  console.error('usage: node tools/set-ext.ts "Note Name" mdx|md [--vault <dir>]');
  process.exit(2);
}
const ROOT = vaultArg();
const from = `${name}.${ext === 'mdx' ? 'md' : 'mdx'}`;
const to = `${name}.${ext}`;

let changes: Change[];
try {
  changes = renameNote(readVaultFiles(ROOT), from, to);
} catch (e) {
  console.error((e as Error).message);
  process.exit(1);
}
execFileSync('git', ['mv', from, to], { cwd: ROOT, stdio: 'inherit' });
for (const c of changes) if (c.text !== null) writeFileSync(join(ROOT, c.path), c.text);
console.log(
  `${from} → ${to}; rewrote links in ${changes.length - 2} other file(s). Now run the check.`,
);
