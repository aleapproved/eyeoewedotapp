import { cpSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

export const PRODUCTION_BRANCH = 'main';

if (isEntrypoint()) main();

function main() {
  const root = process.cwd();
  let stagingRoot = null;
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) {
      usage();
      return;
    }

    const publicRoot = join(root, 'public');
    if (!existsSync(publicRoot) || !existsSync(join(publicRoot, 'index.html')))
      throw new Error(`The product public source is not valid: ${publicRoot}`);

    stagingRoot = mkdtempSync(join(tmpdir(), 'eyeoewe-pages-'));
    cpSync(publicRoot, stagingRoot, {
      recursive: true,
      filter: (source) => shouldCopy(source, publicRoot),
    });

    if (options.production) {
      const verifiedCommit = assertProductionSource(options.commit, { rootPath: root });
      console.log(
        `Production source verified immediately before deployment: ${PRODUCTION_BRANCH} at ${verifiedCommit}, clean checkout.`,
      );
    }

    const wranglerVersion = process.env.WRANGLER_VERSION ?? '4.127.1';
    const command = buildWranglerCommand(options, stagingRoot);
    const deploymentTarget = options.production
      ? 'Production branch ' + PRODUCTION_BRANCH
      : 'Preview branch ' + options.branch;
    console.log(deploymentTarget + ' deployment prepared from the product-only public/ source.');
    console.log(`Running npx ${command.join(' ')}`);
    const result = spawnSync('npx', ['--yes', `wrangler@${wranglerVersion}`, ...command], {
      stdio: 'inherit',
    });
    if (result.error !== undefined) throw result.error;
    if (result.status !== 0) process.exitCode = result.status ?? 1;
  } catch (error) {
    fail(error instanceof Error ? error.message : String(error));
  } finally {
    if (stagingRoot !== null) rmSync(stagingRoot, { recursive: true, force: true });
  }
}

export function parseArguments(argumentsList) {
  const values = {
    projectName: null,
    branch: null,
    commit: null,
    production: false,
    help: false,
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
    else if (argument === '--help') values.help = true;
    else throw new Error(`Unknown argument: ${argument}`);
  }

  if (values.help) return values;
  if (typeof values.projectName !== 'string' || values.projectName.length === 0)
    throw new Error('A confirmed Pages project name is required.');
  if (values.production === (values.branch !== null))
    throw new Error('Choose exactly one deployment target: --production or --branch <name>.');
  if (values.branch === PRODUCTION_BRANCH)
    throw new Error('The production Pages branch is main; use --production for production deployment.');
  if (values.production) {
    if (values.commit === null)
      throw new Error('Production deployment requires --commit <full-reviewed-main-sha>.');
    if (!/^[0-9a-f]{40}$/i.test(values.commit))
      throw new Error('Production deployment requires a full 40-character reviewed main SHA.');
    values.commit = values.commit.toLowerCase();
  } else if (values.commit !== null) {
    throw new Error('--commit can only be used with --production.');
  }
  return values;
}

export function buildWranglerCommand(options, stagingRoot) {
  const command = [
    'pages',
    'deploy',
    stagingRoot,
    '--project-name',
    options.projectName,
  ];
  if (options.production) command.push('--branch', PRODUCTION_BRANCH);
  else command.push('--branch', options.branch);
  return command;
}

export function assertProductionSource(expectedCommit, { rootPath = process.cwd(), runGit = null } = {}) {
  const error = productionSourceError(expectedCommit, { rootPath, runGit });
  if (error !== null) throw new Error(error);
  return expectedCommit;
}

export function productionSourceError(
  expectedCommit,
  { rootPath = process.cwd(), runGit = null } = {},
) {
  if (typeof expectedCommit !== 'string' || !/^[0-9a-f]{40}$/i.test(expectedCommit))
    return 'Production deployment requires a full 40-character reviewed main SHA.';

  expectedCommit = expectedCommit.toLowerCase();
  const resolvedRoot = resolve(rootPath);
  const git = runGit ?? ((argumentsList) => runGitCommand(argumentsList, resolvedRoot));
  const repositoryRoot = git(['rev-parse', '--show-toplevel']);
  if (repositoryRoot === null)
    return 'Production deployment could not inspect the Git checkout.';
  if (resolve(repositoryRoot) !== resolvedRoot)
    return 'Production deployment must run from the website repository root.';

  const branch = git(['branch', '--show-current']);
  if (branch === null) return 'Production deployment could not inspect the current branch.';
  if (branch !== PRODUCTION_BRANCH)
    return `Production deployment requires the ${PRODUCTION_BRANCH} branch; current branch is ${branch || 'detached HEAD'}.`;

  const head = git(['rev-parse', 'HEAD']);
  if (head === null) return 'Production deployment could not inspect HEAD.';
  if (head !== expectedCommit)
    return `Production deployment requires HEAD at reviewed commit ${expectedCommit}.`;

  const main = git(['rev-parse', `refs/heads/${PRODUCTION_BRANCH}`]);
  if (main === null) return 'Production deployment could not inspect the local main commit.';
  if (main !== expectedCommit)
    return `Production deployment requires local main at reviewed commit ${expectedCommit}.`;

  const remoteOutput = git(['ls-remote', '--refs', 'origin', `refs/heads/${PRODUCTION_BRANCH}`]);
  const remoteMain = parseRemoteBranchSha(remoteOutput, PRODUCTION_BRANCH);
  if (remoteMain === null)
    return 'Production deployment could not establish origin/main at deployment time.';
  if (remoteMain !== expectedCommit)
    return `Production deployment requires origin/main at reviewed commit ${expectedCommit}; remote is ${remoteMain}.`;

  const status = git(['status', '--porcelain=v1', '--untracked-files=all']);
  if (status === null) return 'Production deployment could not inspect the working tree.';
  if (status.length > 0)
    return 'Production deployment requires a clean checkout with no tracked or untracked changes.';

  return null;
}

export function parseRemoteBranchSha(output, branch = PRODUCTION_BRANCH) {
  if (typeof output !== 'string') return null;
  const reference = `refs/heads/${branch}`;
  const line = output
    .split(/\r?\n/)
    .map((value) => value.trim())
    .find((value) => value.endsWith(reference));
  if (line === undefined) return null;
  const sha = line.split(/\s+/)[0];
  return /^[0-9a-f]{40}$/i.test(sha) ? sha.toLowerCase() : null;
}

function requireOptionValue(argumentsList, index, option) {
  const value = argumentsList[index + 1];
  if (typeof value !== 'string' || value.length === 0 || value.startsWith('--'))
    throw new Error(option + ' requires a value.');
  return value;
}

function runGitCommand(argumentsList, rootPath) {
  const result = spawnSync('git', argumentsList, {
    cwd: rootPath,
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

function isEntrypoint() {
  return process.argv[1] !== undefined && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
}

function usage() {
  console.log(
    'Production: --production requires --commit <full-reviewed-main-sha> and a clean main checkout at that SHA.',
  );
  console.log('Preview: --branch <preview-name> must use a branch other than main.');
  console.log('Usage:');
  console.log(
    '  node scripts/deploy-public-pages.mjs --project-name <confirmed-eyeoewe-pages-project> --production --commit <full-reviewed-main-sha>',
  );
  console.log(
    '  node scripts/deploy-public-pages.mjs --project-name <confirmed-eyeoewe-pages-project> --branch <preview-name>',
  );
}

function fail(message) {
  console.error(`Public page deployment not run: ${message}`);
  process.exitCode = 1;
}
