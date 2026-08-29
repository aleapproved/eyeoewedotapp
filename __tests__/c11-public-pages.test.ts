import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const read = (relativePath: string) => readFileSync(resolve(process.cwd(), relativePath), 'utf8');
const publicPages = {
  root: read('public/index.html'),
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

describe('C-11 product-only public pages', () => {
  it('publishes a branded root entry that links every required route', () => {
    expect(publicPages.root).toContain('<!doctype html>');
    expect(publicPages.root).toContain('<title>Eye O Ewe</title>');
    expect(publicPages.root).toContain('Eye O Ewe');
    expect(publicPages.root).toContain('alt="Eye O Ewe logo"');
    expect(publicPages.root).not.toMatch(/\bwhat\s+do\s+i\s+owe\s+you\b/i);
    for (const route of requiredRoutes) expect(publicPages.root).toContain(`href="${route}"`);
  });

  it('keeps every required route source branded, static, and free of the retired name', () => {
    for (const page of [publicPages.privacy, publicPages.support, publicPages.deletion]) {
      expect(page).toContain('<!doctype html>');
      expect(page).toContain('Version 1.0');
      expect(page).toContain('Eye O Ewe');
      expect(page).toContain('alt="Eye O Ewe logo"');
      expect(page).not.toMatch(/<script\b/i);
      expect(page).not.toMatch(/\bwhat\s+do\s+i\s+owe\s+you\b/i);
    }
  });

  it('deploys only the product public source', () => {
    expect(deploymentHelper).toContain("const publicRoot = join(root, 'public');");
    expect(deploymentHelper).toContain('cpSync(publicRoot, stagingRoot');
    expect(deploymentHelper).toContain("const PRODUCTION_BRANCH = 'main';");
    expect(deploymentHelper).toContain(
      "if (options.production) command.push('--branch', PRODUCTION_BRANCH);",
    );
    expect(deploymentHelper).toContain(
      'Production: --production always targets Pages branch main.',
    );
    expect(deploymentHelper).toContain(
      'Preview: --branch <preview-name> must use a branch other than main.',
    );
    expect(deploymentHelper).not.toContain('--site-root');
    expect(deploymentHelper).not.toContain('alessandrogillies');
    expect(deploymentDocs).toContain('product-only');
    expect(deploymentDocs).toContain('`--production` is the production mode.');
    expect(deploymentDocs).toContain('`--branch <preview-name>` is the preview mode.');
    expect(deploymentDocs).toContain('--branch main');
    expect(deploymentDocs).toContain('https://eyeoewe.app/');
    expect(deploymentDocs).not.toContain('--site-root');
    expect(deploymentDocs).not.toContain('alessandrogillies');
  });

  it('targets main only for production and keeps previews on named branches', () => {
    expect(deploymentHelper).toContain("const PRODUCTION_BRANCH = 'main';");
    expect(deploymentHelper).toMatch(
      /if \(options\.production\) command\.push\('--branch', PRODUCTION_BRANCH\);\s*else command\.push\('--branch', options\.branch\);/,
    );
    expect(deploymentHelper).toContain('The production Pages branch is main; use --production');
    expect(deploymentHelper).toContain('function requireOptionValue');
    expect(deploymentHelper).toContain("value.startsWith('--')");
    expect(deploymentHelper).toContain(
      'Production: --production always targets Pages branch main.',
    );
    expect(deploymentHelper).toContain(
      'Preview: --branch <preview-name> must use a branch other than main.',
    );
    expect(deploymentDocs).toContain('`--production` is the production mode.');
    expect(deploymentDocs).toContain('`--branch <preview-name>` is the preview mode.');
    expect(deploymentDocs).toContain('--branch main');
  });
});
