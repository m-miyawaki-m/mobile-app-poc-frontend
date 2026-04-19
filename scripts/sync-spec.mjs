import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const SPEC_DIR = resolve('spec');
const GIT_DIR = resolve(SPEC_DIR, '.git');
const DEFAULT_REPO = 'https://github.com/m-miyawaki-m/mobile-app-poc-api-spec.git';

function readPackageRepo() {
  try {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
    return pkg.apiSpecRepo ?? null;
  } catch {
    return null;
  }
}

const repoUrl = process.env.API_SPEC_REPO ?? readPackageRepo() ?? DEFAULT_REPO;

function runGit(args, cwd) {
  const where = cwd ? ` (in ${cwd})` : '';
  console.log(`> git ${args.join(' ')}${where}`);
  const result = spawnSync('git', args, { cwd, stdio: 'inherit' });
  if (result.error) {
    console.error(`Failed to spawn git: ${result.error.message}`);
    process.exit(1);
  }
  if (result.status !== 0) {
    console.error(`git ${args.join(' ')} exited with code ${result.status}`);
    process.exit(result.status ?? 1);
  }
}

if (existsSync(GIT_DIR)) {
  console.log(`spec/ exists. Updating from ${repoUrl}...`);
  runGit(['pull', '--ff-only'], SPEC_DIR);
} else {
  console.log(`Cloning ${repoUrl} into spec/...`);
  runGit(['clone', '--depth', '1', repoUrl, SPEC_DIR]);
}

console.log('spec sync complete.');
