import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { resolve } from 'node:path';

const read = (relativePath) => readFileSync(resolve(process.cwd(), relativePath), 'utf8');
const publicPages = {
  root: read('public/index.html'),
  version: read('public/eyeoewe/v1/index.html'),
  privacy: read('public/eyeoewe/v1/privacy/index.html'),
  support: read('public/eyeoewe/v1/support/index.html'),
  deletion: read('public/eyeoewe/v1/delete-account/index.html'),
};
const requiredRoutes = [
  '/eyeoewe/v1/privacy/',
  '/eyeoewe/v1/support/',
  '/eyeoewe/v1/delete-account/',
];
const deploymentHelper = read('scripts/deploy-public-pages.mjs');
const deploymentDocs = read('docs/public-pages-deploy.md');

test('publishes a branded root entry that links every required route', () => {
  assert.match(publicPages.root, /<!doctype html>/);
  assert.match(publicPages.root, /<title>Eye O Ewe<\/title>/);
  assert.match(publicPages.root, /Eye O Ewe/);
  assert.match(publicPages.root, /alt="Eye O Ewe logo"/);
  assert.doesNotMatch(publicPages.root, /\bwhat\s+do\s+i\s+owe\s+you\b/i);
  for (const route of requiredRoutes)
    assert.ok(publicPages.root.includes('href="' + route + '"'));
});

test('keeps every route source branded, static, and free of the retired name', () => {
  for (const page of Object.values(publicPages)) {
    assert.match(page, /<!doctype html>/);
    assert.match(page, /Version 1\.0/);
    assert.match(page, /Eye O Ewe/);
    assert.match(page, /alt="Eye O Ewe logo"/);
    assert.doesNotMatch(page, /<script\b/i);
    assert.doesNotMatch(page, /\bwhat\s+do\s+i\s+owe\s+you\b/i);
  }
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
