import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  assertProductionSource,
  buildWranglerCommand,
  parseArguments,
  productionSourceError,
} from '../scripts/deploy-public-pages.mjs';

const repositoryRoot = '/tmp/eyeoewe-website-test-repository';
const reviewedSha = 'a'.repeat(40);
const otherSha = 'b'.repeat(40);

function fakeGit({
  root = repositoryRoot,
  branch = 'main',
  head = reviewedSha,
  main = reviewedSha,
  remote = `${reviewedSha}\trefs/heads/main`,
  status = '',
} = {}) {
  return (argumentsList) => {
    const command = argumentsList.join(' ');
    if (command === 'rev-parse --show-toplevel') return root;
    if (command === 'branch --show-current') return branch;
    if (command === 'rev-parse HEAD') return head;
    if (command === 'rev-parse refs/heads/main') return main;
    if (command === 'ls-remote --refs origin refs/heads/main') return remote;
    if (command === 'status --porcelain=v1 --untracked-files=all') return status;
    throw new Error(`Unexpected git command: ${command}`);
  };
}

function sourceError(overrides = {}) {
  return productionSourceError(reviewedSha, {
    rootPath: repositoryRoot,
    runGit: fakeGit(overrides),
  });
}

test('rejects a production source from the wrong branch', () => {
  assert.match(sourceError({ branch: 'codex/website-visual-hardening' }), /requires the main branch/);
});

test('does not invoke npx when production source validation fails', () => {
  const fakeBin = mkdtempSync(join(tmpdir(), 'eyeoewe-npx-test-'));
  const marker = join(fakeBin, 'npx-invoked');
  const fakeNpx = join(fakeBin, 'npx');
  writeFileSync(fakeNpx, '#!/bin/sh\n: > "$EYEOWE_NPX_MARKER"\n');
  chmodSync(fakeNpx, 0o755);

  try {
    const result = spawnSync(
      process.execPath,
      [
        resolve(process.cwd(), 'scripts/deploy-public-pages.mjs'),
        '--project-name',
        'eyeoewe',
        '--production',
        '--commit',
        reviewedSha,
      ],
      {
        cwd: process.cwd(),
        encoding: 'utf8',
        env: {
          ...process.env,
          EYEOWE_NPX_MARKER: marker,
          PATH: fakeBin + ':' + (process.env.PATH ?? ''),
        },
      },
    );

    assert.equal(result.error, undefined);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /Public page deployment not run: Production deployment requires/);
    assert.equal(existsSync(marker), false);
  } finally {
    rmSync(fakeBin, { recursive: true, force: true });
  }
});

test('rejects a production source outside the website repository root', () => {
  assert.match(sourceError({ root: '/tmp/another-repository' }), /website repository root/);
});

test('rejects a malformed production SHA before source validation', () => {
  assert.throws(
    () => parseArguments(['--project-name', 'eyeoewe', '--production', '--commit', 'not-a-sha']),
    /full 40-character reviewed main SHA/,
  );
  assert.match(
    productionSourceError('not-a-sha', { rootPath: repositoryRoot, runGit: fakeGit() }),
    /full 40-character reviewed main SHA/,
  );
});

test('rejects a HEAD that differs from the reviewed SHA', () => {
  assert.match(sourceError({ head: otherSha }), /requires HEAD at reviewed commit/);
});

test('rejects local main when it differs from the reviewed SHA', () => {
  assert.match(sourceError({ main: otherSha }), /requires local main at reviewed commit/);
});

test('rejects remote main when it differs from the reviewed SHA', () => {
  assert.match(
    sourceError({ remote: `${otherSha}\trefs/heads/main` }),
    /requires origin\/main at reviewed commit/,
  );
});

test('rejects an unavailable remote main', () => {
  assert.match(sourceError({ remote: null }), /could not establish origin\/main/);
});

test('rejects tracked working-tree changes', () => {
  assert.match(
    sourceError({ status: ' M public/index.html' }),
    /clean checkout with no tracked or untracked changes/,
  );
});

test('rejects untracked files', () => {
  assert.match(
    sourceError({ status: '?? temporary-preview.html' }),
    /clean checkout with no tracked or untracked changes/,
  );
});

test('accepts a clean production source whose local and remote main agree', () => {
  assert.equal(sourceError(), null);
  assert.doesNotThrow(() =>
    assertProductionSource(reviewedSha, {
      rootPath: repositoryRoot,
      runGit: fakeGit(),
    }),
  );
});

test('keeps previews on named non-main branches', () => {
  const options = parseArguments(['--project-name', 'eyeoewe', '--branch', 'codex/preview']);
  assert.equal(options.production, false);
  assert.deepEqual(buildWranglerCommand(options, '/tmp/staging'), [
    'pages',
    'deploy',
    '/tmp/staging',
    '--project-name',
    'eyeoewe',
    '--branch',
    'codex/preview',
  ]);
  assert.throws(
    () => parseArguments(['--project-name', 'eyeoewe', '--branch', 'main']),
    /production Pages branch is main; use --production/,
  );
});
