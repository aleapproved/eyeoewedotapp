# Public placeholder deployment

The product-only static publish source is `public/`. Its root entry point is
`public/index.html`, and the intended public URL is:

- `https://eyeoewe.app/`

## Product-only Pages boundary

The product Pages project must use only this repository’s `public/` directory
as its upload source. It is a complete static publish directory with no build
step, framework, analytics, tracking, account data, or server-side code. The
root page is the complete placeholder experience. Do not copy or upload a
different site repository.

The `_redirects` file sends the retired `/eyeoewe/v1/` path tree to `/`, so an
old link cannot reveal an earlier page.

The deployment helper makes a temporary filtered copy of `public/`, deploys
that product-only directory with Wrangler, and removes the temporary
directory. It filters `.git`, dependency caches, environment files,
certificates, and keystores if they are ever placed below the publish source.

## Deployment target contract

The helper has two mutually exclusive targets:

- `--production` is the production mode. It always passes
  `--branch main` to Wrangler, which is the confirmed production
  branch for this Pages project.
- `--branch <preview-name>` is the preview mode. The branch name is
  required and must not be `main`, so a preview command cannot
  silently target production.

## Manual production deployment

The exact Pages project name must be confirmed in the owner’s Cloudflare account
before deploying. Do not guess it. From this repository:

```bash
npx --yes wrangler@4.127.1 whoami
npx --yes wrangler@4.127.1 pages project list --json
node scripts/deploy-public-pages.mjs \
  --project-name <confirmed-eyeoewe-pages-project> \
  --production
```

The helper's production invocation explicitly sends `--branch main`. The
deployment command uses Wrangler Direct Upload with no GitHub Actions. The
owner must be authenticated first with `npx --yes wrangler@4.127.1 login`, and
must confirm the selected Pages project is the product project serving
`eyeoewe.app`. A preview can be prepared without changing the production
deployment:

```bash
node scripts/deploy-public-pages.mjs \
  --project-name <confirmed-eyeoewe-pages-project> \
  --branch placeholder-preview
```

Use a non-production branch name for every preview. The helper rejects
`--branch main`; use `--production` when the confirmed
production branch is intended.

After production deployment, check the root URL with a private browser window
and record only the status/route result. Do not paste Cloudflare output
containing account identifiers or tokens into Git or evidence.
