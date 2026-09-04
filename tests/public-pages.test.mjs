import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { test } from 'node:test';
import { resolve } from 'node:path';

const read = (relativePath) => readFileSync(resolve(process.cwd(), relativePath), 'utf8');
const exists = (relativePath) => existsSync(resolve(process.cwd(), relativePath));
const root = read('public/index.html');
const body = root.slice(root.indexOf('<body>'), root.indexOf('</body>'));
const bodyText = body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const styles = read('public/styles.css');
const redirects = read('public/_redirects');
const headers = read('public/_headers');
const workflow = read('.github/workflows/ci.yml');
const readme = read('README.md');
const agents = read('AGENTS.md');
const product = read('PRODUCT.md');
const architecture = read('ARCHITECTURE.md');
const contributing = read('CONTRIBUTING.md');
const release = read('RELEASE.md');
const pullRequestTemplate = read('.github/pull_request_template.md');
const gitignore = read('.gitignore');

test('publishes one branded, intentionally minimal placeholder page', () => {
  assert.match(root, /<!doctype html>/);
  assert.match(root, /<title>Eye O Ewe — Shared expenses, made simple\.<\/title>/);
  assert.match(bodyText, /Eye O Ewe/);
  assert.match(bodyText, /Shared expenses, made simple\./);
  assert.match(bodyText, /Simple\. Free\. Encrypted\./);
  assert.match(bodyText, /Coming soon\./);
  assert.match(root, /src="\/app-icon\.webp"/);
  assert.match(root, /<img class="brand-mark" src="\/app-icon\.webp"[^>]+width="44"[^>]+height="44"/);
  assert.equal((root.match(/src="\/app-icon\.webp"/g) ?? []).length, 1);
  assert.match(root, /href="\/favicon\.png"/);
  assert.match(root, /<link rel="icon" type="image\/png" sizes="64x64" href="\/favicon\.png"/);
  assert.match(root, /og:image.*social-preview\.jpg/);
  assert.match(root, /twitter:image.*social-preview\.jpg/);
  assert.equal((bodyText.match(/Coming soon\./g) ?? []).length, 1);
  assert.doesNotMatch(root, /<footer\b|<nav\b|<form\b|<button\b|<input\b/);
  assert.doesNotMatch(root, /hero-visual/);
  assert.doesNotMatch(root, /status-dot/);
  assert.doesNotMatch(root, /<script\b|theme-toggle|data-theme|color-scheme="dark"/);
  assert.doesNotMatch(root, /privacy|support|delete-account|what\s+do\s+i\s+owe\s+you/i);
  assert.doesNotMatch(
    root,
    /Free forever|Optional one-off unlocks|End-to-end encrypted|feature grid|signup|store badge/i,
  );
  assert.ok(exists('public/app-icon.png'));
  assert.ok(exists('public/app-icon.webp'));
  assert.ok(exists('public/social-preview.jpg'));
  assert.ok(exists('public/favicon.png'));
  assert.ok(exists('public/styles.css'));
  assert.ok(!exists('public/eyeoewe-logo.png'));
  assert.ok(!exists('public/theme-toggle.js'));
  assert.match(redirects, /^\/eyeoewe\/v1\/\* \/ 302$/m);
  assert.ok(!exists('public/eyeoewe'));
});

test('uses the mobile app visual language with responsive, accessible styling', () => {
  for (const color of [
    '#FAF8F6',
    '#FDFCFB',
    '#072240',
    '#5A6674',
    '#87919B',
    '#EDEBEA',
    '#D3D0CD',
    '#E7B43A',
  ]) {
    assert.match(styles, new RegExp(color));
  }
  assert.match(styles, /Georgia, "Times New Roman", serif/);
  assert.match(styles, /\.brand:focus-visible/);
  assert.match(styles, /@media \(max-width: 820px\)/);
  assert.match(styles, /@media \(max-width: 420px\)/);
  assert.match(styles, /@media \(prefers-reduced-motion: reduce\)/);
  assert.doesNotMatch(styles, /\.hero-visual/);
  assert.doesNotMatch(styles, /\.status-dot/);
});

test('serves restrictive headers compatible with this static page', () => {
  assert.match(headers, /Content-Security-Policy:/);
  for (const directive of [
    "default-src 'self'",
    "base-uri 'none'",
    "frame-ancestors 'none'",
    "form-action 'none'",
    "img-src 'self'",
    "style-src 'self'",
    "script-src 'none'",
    "connect-src 'none'",
    "font-src 'none'",
    "object-src 'none'",
    "media-src 'none'",
  ]) {
    assert.ok(headers.includes(directive), "missing header directive: " + directive);
  }
  assert.doesNotMatch(headers, /unsafe-inline|unsafe-eval|https?:\/\//);
  assert.match(headers, /Permissions-Policy:/);
  assert.match(headers, /Referrer-Policy: no-referrer/);
  assert.match(headers, /X-Content-Type-Options: nosniff/);
  assert.match(headers, /X-Frame-Options: DENY/);
});

test('defines the minimal PR and main CI workflow', () => {
  assert.match(workflow, /^name: CI$/m);
  assert.match(workflow, /pull_request:[\s\S]*branches:[\s\S]*- main/);
  assert.match(workflow, /push:[\s\S]*branches:[\s\S]*- main/);
  assert.match(workflow, /permissions:\s*\n\s+contents: read/);
  assert.match(workflow, /node-version: 20/);
  assert.match(workflow, /run: npm ci/);
  assert.match(workflow, /run: npm test/);
  assert.match(workflow, /run: node --check scripts\/deploy-public-pages\.mjs/);
  assert.match(workflow, /name: Test website/);
});

test('defines the durable website documentation model and product boundary', () => {
  for (const document of [
    'README.md',
    'PRODUCT.md',
    'ARCHITECTURE.md',
    'CONTRIBUTING.md',
    'RELEASE.md',
    'AGENTS.md',
    '.github/pull_request_template.md',
  ]) {
    assert.ok(exists(document), `missing workflow document: ${document}`);
  }
  assert.match(readme, /\[PRODUCT\.md\]\(PRODUCT\.md\)/);
  assert.match(readme, /\[ARCHITECTURE\.md\]\(ARCHITECTURE\.md\)/);
  assert.match(readme, /\[CONTRIBUTING\.md\]\(CONTRIBUTING\.md\)/);
  assert.match(readme, /\[RELEASE\.md\]\(RELEASE\.md\)/);
  for (const copy of [
    'Eye O Ewe',
    'Shared expenses, made simple\\.',
    'Simple\\. Free\\. Encrypted\\.',
    'Coming soon\\.',
  ]) {
    assert.match(product, new RegExp(copy));
  }
  assert.match(product, /no navigation/);
  assert.match(product, /no policy, legal, support, or\s+account-deletion content/);
  assert.match(product, /analytics or tracking/);
  assert.match(architecture, /static website/);
  assert.match(architecture, /All deployable source lives under\s+`public\/`/);
  assert.match(architecture, /no framework or application build system/);
  assert.match(architecture, /no backend, account data, runtime application code, or\s+tracking/);
});

test('documents the fetched origin/main task-base and reconciliation rule', () => {
  assert.match(contributing, /git fetch origin/);
  assert.match(contributing, /git rev-parse --verify refs\/remotes\/origin\/main/);
  assert.match(contributing, /git worktree add -b codex\/\<short-slug\>/);
  assert.match(contributing, /Never start from local `main`/);
  assert.match(contributing, /If the fetch or\s+the `origin\/main` resolution fails, stop/);
  assert.match(contributing, /rebase an unpublished branch onto the new `origin\/main`/);
  assert.match(contributing, /Do not force-push without separate owner approval/);
  assert.match(contributing, /PR branch must be up to date with\s+protected `main`/);
  assert.match(agents, /Before creating a task branch or worktree, fetch `origin`/);
  assert.match(agents, /Never use local `main`\s+as a substitute/);
  assert.match(agents, /If `origin\/main` cannot be read, stop/);
});

test('documents automatic Pages publication, guarded manual recovery, and evidence boundaries', () => {
  assert.match(release, /automatically\s+deploys the production site when `main` changes/);
  assert.match(release, /Merge to `main`[\s\S]*triggers the Pages production deployment/);
  assert.match(release, /authorization for the public release/);
  assert.match(release, /no second post-merge production approval/);
  assert.match(release, /manual Wrangler production helper as a routine second release step/);
  assert.match(release, /git ls-remote/);
  assert.match(release, /dedicated clean release\s+checkout/);
  assert.match(release, /https:\/\/eyeoewe\.app\//);
  assert.match(release, /security headers defined in `public\/_headers`/);
  assert.match(release, /reserved `\/eyeoewe\/v1\/\.\.\.` route/);
  assert.match(architecture, /manual Wrangler helper is retained for recovery/);
  assert.match(architecture, /not an equivalent normal release\s+path/);
  assert.doesNotMatch(readme, /following actions require separate, explicit owner approval/);
});

test('keeps the PR template and local tooling boundary lightweight', () => {
  for (const heading of ['Summary', 'Scope and safety', 'Verification', 'Review']) {
    assert.match(pullRequestTemplate, new RegExp(`^## ${heading}$`, 'm'));
  }
  for (const field of ['Linked issue', 'Outcome', 'Task base SHA', 'Local tests', 'Browser or visual review', 'Hosted or deployment boundary', 'Unavailable checks', 'Exact reviewed commit', 'Findings or blockers']) {
    assert.match(pullRequestTemplate, new RegExp(`- ${field}:`));
  }
  assert.match(gitignore, /^\.wrangler\/$/m);
});
