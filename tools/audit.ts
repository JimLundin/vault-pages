// The weekly sweep's audit (core/audit.ts) from the working tree, with git for what changed this week.
// `node tools/audit.ts [--vault <dir>] [--since "8 days ago"]` (default the working directory). Reports; changes nothing.
import { execSync } from 'node:child_process';
import { audit, report, type History } from '../core/audit.ts';
import { today } from '../core/format.ts';
import { loadNotes } from '../core/vault.ts';
import { schemaOf } from '../core/schema.ts';
import { readVaultFiles, vaultArg } from './fs.ts';

const since = (() => {
  const i = process.argv.indexOf('--since');
  return i > 0 ? process.argv[i + 1] : '8 days ago';
})();
const git = (cmd: string) => {
  try {
    return execSync(`git ${cmd}`, {
      cwd: vaultArg(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return null;
  }
};

const base = git(`rev-list -1 --before="${since}" HEAD`)?.trim();
const history: History = {
  changed: new Set(
    (git(`log --since="${since}" --name-only --format= -- '*.md' '*.mdx'`) ?? '')
      .split('\n')
      .filter(Boolean),
  ),
  before: async (path) => (base ? git(`show ${base}:"${path}"`) : null),
};
const day = (() => {
  try {
    return execSync(`date -d "${since}" +%F`, { encoding: 'utf8' }).trim();
  } catch {
    return '0000';
  }
})();

const files = readVaultFiles(vaultArg());
process.stdout.write(
  report(await audit(loadNotes(files), schemaOf(files), history, today(), day, since)),
);
