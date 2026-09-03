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

test('publishes one branded, intentionally minimal placeholder page', () => {
  assert.match(root, /<!doctype html>/);
  assert.match(root, /<title>Eye O Ewe — Shared expenses, made simple\.<\/title>/);
  assert.match(bodyText, /Eye O Ewe/);
  assert.match(bodyText, /Shared expenses, made simple\./);
  assert.match(bodyText, /Simple\. Free\. Encrypted\./);
  assert.match(bodyText, /Coming soon\./);
  assert.match(root, /src="\/app-icon\.webp"/);
  assert.match(root, /href="\/favicon\.png"/);
  assert.match(root, /og:image.*social-preview\.jpg/);
  assert.match(root, /twitter:image.*social-preview\.jpg/);
  assert.equal((bodyText.match(/Coming soon\./g) ?? []).length, 1);
  assert.doesNotMatch(root, /<footer\b|<nav\b|<form\b|<button\b|<input\b/);
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
  assert.match(styles, /box-shadow: 0 18px 40px/);
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

test('documents the remote-main production source guarantee and approval boundary', () => {
  assert.match(readme, /read-only .*git ls-remote.*origin\/main/);
  assert.match(readme, /unavailable or mismatched .*origin\/main/);
  assert.match(readme, /following actions require separate, explicit owner approval/);
  assert.match(readme, /Cleanup is a separate approved action/);
  assert.match(agents, /read-only remote check proving .*origin\/main/);
  assert.match(agents, /An implementation request authorises local work only/);
  assert.match(agents, /deployment does not\s+authorise cleanup/);
});
