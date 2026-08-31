import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { resolve } from 'node:path';

const read = (relativePath) => readFileSync(resolve(process.cwd(), relativePath), 'utf8');
const root = read('public/index.html');
const styles = read('public/styles.css');
const redirects = read('public/_redirects');
const themeScript = read('public/theme-toggle.js');
const deploymentHelper = read('scripts/deploy-public-pages.mjs');
const readme = read('README.md');
const agents = read('AGENTS.md');

test('publishes one branded, product-only placeholder page', () => {
  assert.match(root, /<!doctype html>/);
  assert.match(root, /<title>Eye O Ewe — Shared expenses, kept simple<\/title>/);
  assert.match(root, /Eye O Ewe/);
  assert.match(root, /class="headline-line">Shared<\/span>/);
  assert.match(root, /class="headline-line">expenses,[\s\S]*kept simple\./);
  assert.match(root, /src="\/eyeoewe-logo\.png"/);
  assert.match(root, /Simple by default/);
  assert.match(root, /Free forever/);
  assert.match(root, /Optional one-off unlocks/);
  assert.match(root, /End-to-end encrypted/);
  assert.match(root, /Eye O Ewe never sees your private data/);
  assert.equal((root.match(/Coming soon/g) ?? []).length, 1);
  assert.doesNotMatch(root, /<footer\b/);
  assert.match(root, /data-theme-toggle/);
  assert.match(root, /theme-toggle\.js/);
  assert.doesNotMatch(root, /\bwhat\s+do\s+i\s+owe\s+you\b/i);
  assert.doesNotMatch(root, /privacy|support|delete-account/i);
  assert.doesNotMatch(
    root,
    /Less spreadsheet|Something good is on the way|Keep the big picture|feature maze|attention traps|We['’]re building towards/i,
  );
  assert.ok(existsSync(resolve(process.cwd(), 'public/eyeoewe-logo.png')));
  assert.ok(existsSync(resolve(process.cwd(), 'public/styles.css')));
  assert.ok(existsSync(resolve(process.cwd(), 'public/theme-toggle.js')));
  assert.match(redirects, /^\/eyeoewe\/v1\/\* \/ 301$/m);
  assert.ok(!existsSync(resolve(process.cwd(), 'public/eyeoewe')));
});

test('keeps the placeholder responsive and respectful of reduced motion', () => {
  assert.match(styles, /@media \(max-width: 960px\)/);
  assert.match(styles, /@media \(max-width: 520px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
});

test('provides an accessible persistent light and dark mode switch', () => {
  assert.match(root, /window\.localStorage\.getItem\(storageKey\)/);
  assert.match(themeScript, /window\.localStorage\.setItem/);
  assert.match(themeScript, /addEventListener\("click"/);
  assert.match(themeScript, /aria-pressed/);
  assert.match(themeScript, /Switch to light mode/);
  assert.match(themeScript, /Switch to dark mode/);
  assert.match(themeScript, /meta\[name="theme-color"\]/);
  assert.match(styles, /:root\[data-theme="dark"\]/);
  assert.match(styles, /color-scheme: dark/);
  assert.doesNotMatch(root, /sunwash/);
  assert.doesNotMatch(styles, /\.sunwash/);
  assert.doesNotMatch(styles, /\.site-footer/);
});

test('deploys only the product public source', () => {
  assert.match(deploymentHelper, /const publicRoot = join\(root, 'public'\);/);
  assert.match(deploymentHelper, /cpSync\(publicRoot, stagingRoot/);
  assert.match(deploymentHelper, /const PRODUCTION_BRANCH = 'main';/);
  assert.match(
    deploymentHelper,
    /if \(options\.production\) command\.push\('--branch', PRODUCTION_BRANCH\);/,
  );
  assert.match(deploymentHelper, /Production: --production always targets Pages branch main\./);
  assert.match(
    deploymentHelper,
    /Preview: --branch <preview-name> must use a branch other than main\./,
  );
  assert.doesNotMatch(deploymentHelper, /--site-root|alessandrogillies/);
  assert.match(readme, /complete deployable site is under `public\/`/);
  assert.match(readme, /The public route is:/);
  assert.ok(!existsSync(resolve(process.cwd(), 'docs')));
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
  assert.match(deploymentHelper, /Production: --production always targets Pages branch main\./);
  assert.match(
    deploymentHelper,
    /Preview: --branch <preview-name> must use a branch other than main\./,
  );
  assert.ok(readme.includes('npm run deploy:production'));
  assert.ok(readme.includes('npm run deploy:preview'));
  assert.ok(readme.includes('--branch <named-preview-branch>'));
  assert.ok(readme.includes('always sends `--branch main`'));
});

test('keeps remote actions behind explicit approval gates', () => {
  assert.match(agents, /An implementation request authorises local work only/);
  assert.match(agents, /pushing a branch or creating or updating a pull request/);
  assert.match(agents, /merging does not authorise production deployment/);
  assert.match(agents, /deployment does not\s+authorise cleanup/);
  assert.match(readme, /following actions require separate, explicit owner approval/);
  assert.match(readme, /Publish the reviewed `main` commit to Cloudflare Pages/);
  assert.match(readme, /Cleanup is a separate approved action/);
});
