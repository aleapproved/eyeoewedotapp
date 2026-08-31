import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { resolve } from 'node:path';

const read = (relativePath) => readFileSync(resolve(process.cwd(), relativePath), 'utf8');
const root = read('public/index.html');
const styles = read('public/styles.css');
const redirects = read('public/_redirects');
const deploymentHelper = read('scripts/deploy-public-pages.mjs');
const deploymentDocs = read('docs/public-pages-deploy.md');

test('publishes one branded, product-only placeholder page', () => {
  assert.match(root, /<!doctype html>/);
  assert.match(root, /<title>Eye O Ewe — See who owes what<\/title>/);
  assert.match(root, /Eye O Ewe/);
  assert.match(root, /See who<br \/><em>owes what\.<\/em>/);
  assert.match(root, /src="\/eyeoewe-logo\.png"/);
  assert.match(root, /Eye O Ewe is coming soon/);
  assert.doesNotMatch(root, /\bwhat\s+do\s+i\s+owe\s+you\b/i);
  assert.doesNotMatch(root, /privacy|support|delete-account/i);
  assert.doesNotMatch(root, /<script\b/i);
  assert.ok(existsSync(resolve(process.cwd(), 'public/eyeoewe-logo.png')));
  assert.ok(existsSync(resolve(process.cwd(), 'public/styles.css')));
  assert.match(redirects, /^\/eyeoewe\/v1\/\* \/ 301$/m);
  assert.ok(!existsSync(resolve(process.cwd(), 'public/eyeoewe')));
});

test('keeps the placeholder responsive and respectful of reduced motion', () => {
  assert.match(styles, /@media \(max-width: 850px\)/);
  assert.match(styles, /@media \(max-width: 520px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
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
  assert.match(deploymentDocs, /product-only/);
  assert.ok(deploymentDocs.includes('--production'));
  assert.ok(deploymentDocs.includes('--branch <preview-name>'));
  assert.ok(deploymentDocs.includes('--branch main'));
  assert.ok(deploymentDocs.includes('https://eyeoewe.app/'));
  assert.doesNotMatch(deploymentDocs, /--site-root|alessandrogillies/);
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
  assert.ok(deploymentDocs.includes('--production'));
  assert.ok(deploymentDocs.includes('--branch <preview-name>'));
  assert.ok(deploymentDocs.includes('--branch main'));
});
