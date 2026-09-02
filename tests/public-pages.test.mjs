import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { resolve } from 'node:path';

const read = (relativePath) => readFileSync(resolve(process.cwd(), relativePath), 'utf8');
const root = read('public/index.html');
const styles = read('public/styles.css');
const redirects = read('public/_redirects');
const deploymentHelper = read('scripts/deploy-public-pages.mjs');
const readme = read('README.md');
const agents = read('AGENTS.md');

test('publishes one branded, product-only placeholder page', () => {
  assert.match(root, /<!doctype html>/);
  assert.match(root, /<title>Eye O Ewe — Shared expenses, made simple\.<\/title>/);
  assert.match(root, /Eye O Ewe/);
  assert.match(root, /class="headline-line headline-line--light">Shared expenses,<\/span>/);
  assert.match(root, /class="headline-line">made simple\.<\/span>/);
  assert.match(root, /src="\/app-icon\.png"/);
  assert.match(root, /Simple\. Free\. Encrypted\./);
  assert.equal((root.match(/Coming soon\./g) ?? []).length, 1);
  assert.doesNotMatch(root, /<footer\b/);
  assert.doesNotMatch(root, /\bwhat\s+do\s+i\s+owe\s+you\b/i);
  assert.doesNotMatch(root, /privacy|support|delete-account/i);
  assert.doesNotMatch(
    root,
    /Less spreadsheet|Something good is on the way|Keep the big picture|feature maze|attention traps|We['’]re building towards/i,
  );
  assert.ok(existsSync(resolve(process.cwd(), 'public/app-icon.png')));
  assert.ok(existsSync(resolve(process.cwd(), 'public/styles.css')));
  assert.match(redirects, /^\/eyeoewe\/v1\/\* \/ 301$/m);
  assert.ok(!existsSync(resolve(process.cwd(), 'public/eyeoewe')));
});

test('keeps the placeholder responsive and respectful of reduced motion', () => {
  assert.match(styles, /@media \(max-width: 760px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});

test('keeps the landing page light and focused on the supplied composition', () => {
  assert.match(root, /meta name="color-scheme" content="light"/);
  assert.match(root, /rel="icon" href="\/app-icon\.png"/);
  assert.match(styles, /--canvas: #fbf4ee/);
  assert.match(styles, /font-family:\s*Inter/);
  assert.match(styles, /\.brand-mark\s*\{[\s\S]*?border-radius: 50%;/);
  assert.match(styles, /\.headline-line--light\s*\{[\s\S]*font-weight: 400/);
  assert.doesNotMatch(root, /status-dot/);
  assert.doesNotMatch(styles, /\.status-dot/);
  assert.doesNotMatch(root, /data-theme-toggle|theme-toggle\.js/);
  assert.doesNotMatch(root, /principles|Simple by default|Free forever/);
  assert.doesNotMatch(styles, /\.theme-toggle|\.principle|:root\[data-theme="dark"\]/);
});

test('deploys only the product public source', () => {
  assert.match(deploymentHelper, /const publicRoot = join\(root, 'public'\);/);
  assert.match(deploymentHelper, /cpSync\(publicRoot, stagingRoot/);
  assert.match(deploymentHelper, /const PRODUCTION_BRANCH = 'main';/);
  assert.match(
    deploymentHelper,
    /if \(options\.production\) command\.push\('--branch', PRODUCTION_BRANCH\);/,
  );
  assert.match(
    deploymentHelper,
    /Production: --production requires --commit <full-reviewed-main-sha>/,
  );
  assert.match(
    deploymentHelper,
    /Preview: --branch <preview-name> must use a branch other than main\./,
  );
  assert.doesNotMatch(deploymentHelper, /--site-root|alessandrogillies/);
  assert.ok(deploymentHelper.includes("if (options.production) assertProductionSource(options.commit);"));
  assert.ok(deploymentHelper.includes("if (!/^[0-9a-f]{40}$/i.test(values.commit))"));
  assert.match(deploymentHelper, /status', '--porcelain=v1', '--untracked-files=all'/);
  assert.match(readme, /complete deployable site is under `public\/`/);
  assert.match(readme, /The public route is:/);
  assert.ok(!existsSync(resolve(process.cwd(), 'docs/public-pages-deploy.md')));
});

test('targets main only for production and keeps previews on named branches', () => {
  assert.match(deploymentHelper, /const PRODUCTION_BRANCH = 'main';/);
  assert.match(
    deploymentHelper,
    /if \(options\.production\) command\.push\('--branch', PRODUCTION_BRANCH\);\s*else command\.push\('--branch', options\.branch\);/,
  );
  assert.match(deploymentHelper, /The production Pages branch is main; use --production/);
  assert.match(deploymentHelper, /function requireOptionValue/);
  assert.match(deploymentHelper, /value\.startsWith\('--'\)/);
  assert.match(
    deploymentHelper,
    /Production: --production requires --commit <full-reviewed-main-sha>/,
  );
  assert.match(
    deploymentHelper,
    /Preview: --branch <preview-name> must use a branch other than main\./,
  );
  assert.ok(readme.includes('npm run deploy:production'));
  assert.ok(readme.includes('npm run deploy:preview'));
  assert.ok(readme.includes('--branch <named-preview-branch>'));
  assert.match(deploymentHelper, /Production deployment requires --commit/);
  assert.ok(deploymentHelper.includes('if (branch !== PRODUCTION_BRANCH)'));
  assert.match(deploymentHelper, /HEAD and local main at reviewed commit/);
  assert.match(readme, /exact Pages deployment identifier and/);
  assert.match(readme, /selected branch, deployed commit/);
  assert.doesNotMatch(readme, /Record the route and status only/);
  assert.match(readme, /always sends[\s\S]+--branch main/);
});

test('keeps remote actions behind explicit approval gates', () => {
  assert.match(agents, /An implementation request authorises local work only/);
  assert.match(agents, /pushing a branch or creating or updating a pull request/);
  assert.match(agents, /merging does not authorise production deployment/);
  assert.match(agents, /deployment does not\s+authorise cleanup/);
  assert.match(readme, /following actions require separate, explicit owner approval/);
  assert.match(agents, /dedicated clean release checkout/);
  assert.match(agents, /exact full reviewed SHA supplied to the\s+deployment helper/);
  assert.match(agents, /deployed commit/);
  assert.match(agents, /Cloudflare Pages deployment, selected branch and commit, and live response/);
  assert.match(readme, /exact Pages project must be confirmed in the owner/);
  assert.match(readme, /Keep the local checkout and remote state separate in status reports/);
  assert.match(readme, /Redact\s+account identifiers, access tokens/);
  assert.match(readme, /Publish the reviewed `main` commit to Cloudflare Pages/);
  assert.match(readme, /Cleanup is a separate approved action/);
});
