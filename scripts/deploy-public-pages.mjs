import { cpSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const PRODUCTION_BRANCH = 'main';
const root = process.cwd();
const options = parseArguments(process.argv.slice(2));
const publicRoot = join(root, 'public');

if (!existsSync(publicRoot) || !existsSync(join(publicRoot, 'index.html')))
  fail(`The product public source is not valid: ${publicRoot}`);

const stagingRoot = mkdtempSync(join(tmpdir(), 'eyeoewe-pages-'));
try {
  cpSync(publicRoot, stagingRoot, {
    recursive: true,
    filter: (source) => shouldCopy(source, publicRoot),
  });

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
  return values;
}

function requireOptionValue(argumentsList, index, option) {
  const value = argumentsList[index + 1];
  if (typeof value !== 'string' || value.length === 0 || value.startsWith('--'))
    fail(option + ' requires a value.');
  return value;
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
  console.log('Production: --production always targets Pages branch main.');
  console.log('Preview: --branch <preview-name> must use a branch other than main.');
  console.log(`Usage:
  node scripts/deploy-public-pages.mjs \\
    --project-name <confirmed-eyeoewe-pages-project> --production
  node scripts/deploy-public-pages.mjs \\
    --project-name <confirmed-eyeoewe-pages-project> --branch <preview-name>`);
  process.exit(0);
}

function fail(message) {
  console.error(`Public page deployment not run: ${message}`);
  process.exit(1);
}
