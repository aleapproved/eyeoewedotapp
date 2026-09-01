import { cpSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const PRODUCTION_BRANCH = 'main';
const root = process.cwd();
const options = parseArguments(process.argv.slice(2));
const publicRoot = join(root, 'public');

if (!existsSync(publicRoot) || !existsSync(join(publicRoot, 'index.html')))
  fail(`The product public source is not valid: ${publicRoot}`);

if (options.production) assertProductionSource(options.commit);

const stagingRoot = mkdtempSync(join(tmpdir(), 'eyeoewe-pages-'));
try {
  cpSync(publicRoot, stagingRoot, {
    recursive: true,
    filter: (source) => shouldCopy(source, publicRoot),
  });

  if (options.production) {
    const verifiedCommit = assertProductionSource(options.commit, stagingRoot);
    console.log(
      `Production source verified immediately before deployment: ${PRODUCTION_BRANCH} at ${verifiedCommit}, clean checkout.`,
    );
  }

  const wranglerVersion = process.env.WRANGLER_VERSION ?? '4.127.1';
  const command = [
    '--yes',
    `wrangler@${wranglerVersion}`,
    'pages',
    'deploy',
    stagingRoot,
    '--project-name',
    options.projectName,
  ];
  if (options.production) command.push('--branch', PRODUCTION_BRANCH);
  else command.push('--branch', options.branch);

  const deploymentTarget = options.production
    ? 'Production branch ' + PRODUCTION_BRANCH
    : 'Preview branch ' + options.branch;
  console.log(deploymentTarget + ' deployment prepared from the product-only public/ source.');
  console.log(`Running npx ${command.join(' ')}`);
  const result = spawnSync('npx', command, { stdio: 'inherit' });
  if (result.error !== undefined) fail(`Wrangler could not be started: ${result.error.message}`);
  if (result.status !== 0) process.exitCode = result.status ?? 1;
} finally {
  rmSync(stagingRoot, { recursive: true, force: true });
}

function parseArguments(argumentsList) {
  const values = {
    projectName: null,
    branch: null,
    commit: null,
    production: false,
  };
  for (let index = 0; index < argumentsList.length; index += 1) {
    const argument = argumentsList[index];
    if (argument === '--project-name') {
      values.projectName = requireOptionValue(argumentsList, index, argument);
      index += 1;
    } else if (argument === '--branch') {
      values.branch = requireOptionValue(argumentsList, index, argument);
      index += 1;
    } else if (argument === '--commit') {
      values.commit = requireOptionValue(argumentsList, index, argument);
      index += 1;
    } else if (argument === '--production') values.production = true;
    else if (argument === '--help') usage();
    else fail(`Unknown argument: ${argument}`);
  }
  if (typeof values.projectName !== 'string' || values.projectName.length === 0)
    fail('A confirmed Pages project name is required.');
  if (values.production === (values.branch !== null))
    fail('Choose exactly one deployment target: --production or --branch <name>.');
  if (values.branch === PRODUCTION_BRANCH)
    fail('The production Pages branch is main; use --production for production deployment.');
  if (values.production) {
    if (values.commit === null)
      fail('Production deployment requires --commit <full-reviewed-main-sha>.');
    if (!/^[0-9a-f]{40}$/i.test(values.commit))
      fail('Production deployment requires a full 40-character reviewed main SHA.');
  } else if (values.commit !== null) {
    fail('--commit can only be used with --production.');
  }
  return values;
}

function requireOptionValue(argumentsList, index, option) {
  const value = argumentsList[index + 1];
  if (typeof value !== 'string' || value.length === 0 || value.startsWith('--'))
    fail(option + ' requires a value.');
  return value;
}

function assertProductionSource(expectedCommit, stagingRoot = null) {
  const error = productionSourceError(expectedCommit);
  if (error !== null) {
    if (stagingRoot !== null) rmSync(stagingRoot, { recursive: true, force: true });
    fail(error);
  }
  return expectedCommit;
}

function productionSourceError(expectedCommit) {
  const repositoryRoot = runGit(['rev-parse', '--show-toplevel']);
  if (repositoryRoot === null)
    return 'Production deployment could not inspect the Git checkout.';
  if (resolve(repositoryRoot) !== resolve(root))
    return 'Production deployment must run from the website repository root.';

  const branch = runGit(['branch', '--show-current']);
  if (branch === null) return 'Production deployment could not inspect the current branch.';
  if (branch !== PRODUCTION_BRANCH)
    return `Production deployment requires the ${PRODUCTION_BRANCH} branch; current branch is ${branch || 'detached HEAD'}.`;

  const head = runGit(['rev-parse', 'HEAD']);
  const main = runGit(['rev-parse', `refs/heads/${PRODUCTION_BRANCH}`]);
  if (head === null || main === null)
    return 'Production deployment could not inspect the local main commit.';
  if (head !== expectedCommit || main !== expectedCommit)
    return `Production deployment requires HEAD and local main at reviewed commit ${expectedCommit}.`;

  const status = runGit(['status', '--porcelain=v1', '--untracked-files=all']);
  if (status === null) return 'Production deployment could not inspect the working tree.';
  if (status.length > 0)
    return 'Production deployment requires a clean checkout with no tracked or untracked changes.';

  return null;
}

function runGit(argumentsList) {
  const result = spawnSync('git', argumentsList, {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.error !== undefined || result.status !== 0) return null;
  return result.stdout.trim();
}

function shouldCopy(source, sourceRootPath) {
  if (source === sourceRootPath) return true;
  const relative = source.slice(sourceRootPath.length + 1);
  const segments = relative.split('/');
  if (segments.includes('.git') || segments.includes('node_modules')) return false;
  if (segments.includes('coverage') || segments.includes('playwright-report')) return false;
  if (segments.includes('test-results')) return false;
  if (/^\.env(?:\.|$)/i.test(segments.at(-1) ?? '')) return false;
  if (/\.(?:pem|p12|pfx|key|keystore|jks)$/i.test(segments.at(-1) ?? '')) return false;
  return true;
}

function usage() {
  console.log(
    'Production: --production requires --commit <full-reviewed-main-sha> and a clean main checkout at that SHA.',
  );
  console.log('Preview: --branch <preview-name> must use a branch other than main.');
  console.log(`Usage:
  node scripts/deploy-public-pages.mjs \\
    --project-name <confirmed-eyeoewe-pages-project> \\
    --production --commit <full-reviewed-main-sha>
  node scripts/deploy-public-pages.mjs \\
    --project-name <confirmed-eyeoewe-pages-project> --branch <preview-name>`);
  process.exit(0);
}

function fail(message) {
  console.error(`Public page deployment not run: ${message}`);
  process.exit(1);
}
