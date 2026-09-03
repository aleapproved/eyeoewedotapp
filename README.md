# Eye O Ewe website

This repository contains the single-page public website for Eye O Ewe. The
mobile app remains in its separate repository.

## Source

The complete deployable site is under `public/`. It has no build step,
analytics, tracking, account data, or server-side code.

The public route is:

- `https://eyeoewe.app/`

## Local verification

From the repository root:

```bash
npm ci
npm test
git diff --check
git status --short
```

`npm test` checks the page, branding, static-only boundary, and deployment
target rules. For visual changes, serve `public/` with a local static-file
server and inspect the rendered page at mobile and desktop sizes.

Do not treat local checks or local visual review as evidence of a GitHub merge,
Cloudflare deployment, or live response.

## Delivery workflow

Work on a local branch and review the complete diff before asking to push. The
following actions require separate, explicit owner approval:

1. Push the branch and create or update a pull request.
2. Merge the reviewed pull request into `main`.
3. Publish the reviewed `main` commit to Cloudflare Pages.
4. Remove the merged branch, its worktree, or any preview deployment.

Keep the local checkout and remote state separate in status reports. Preserve
untracked user files and unrelated branches throughout the workflow.

## Cloudflare Pages

The exact Pages project must be confirmed in the owner’s Cloudflare account
before any deployment. Do not guess the project name. The owner must already
be authenticated with Wrangler.

Check the account and available Pages projects when release work has been
authorised:

```bash
npx --yes wrangler@4.127.1 whoami
npx --yes wrangler@4.127.1 pages project list --json
```

### Preview

A preview requires explicit owner approval and a named branch other than
`main`. It cannot publish the production branch:

```bash
npm run deploy:preview -- \
  --project-name <confirmed-eyeoewe-pages-project> \
  --branch <named-preview-branch>
```

### Production

Production requires explicit owner approval after the reviewed change has been
merged to `main`. Run it from a dedicated clean release checkout,
separate from the implementation checkout. Immediately before deployment, the
helper requires all of the following:

- the current directory is the website repository root;
- the current branch is `main`;
- `HEAD` and `refs/heads/main` are both the exact full 40-character SHA passed
  with `--commit`; and
- a read-only `git ls-remote` check resolves `origin/main` to that same SHA;
- the working tree has no tracked or untracked changes.

If any check fails, including an unavailable or mismatched `origin/main`, the
Pages deployment is not run.

```bash
npm run deploy:production -- \
  --project-name <confirmed-eyeoewe-pages-project> \
  --commit <reviewed-main-sha>
```

The `--commit` value must be the full SHA of the reviewed commit already merged
to `main`. The deployment helper uploads only `public/` and always sends
`--branch main` for production. It rejects `--branch main` when a preview is
requested.

After publishing, verify and report the exact Pages deployment identifier and
URL, selected branch, deployed commit, and root route and status. Redact
account identifiers, access tokens, and other sensitive Wrangler output from
GitHub and repository files.

## Final tidy state

Cleanup is a separate approved action. After a successful, verified
publication, remove only the merged feature branch, its dedicated worktree,
and specifically authorised preview deployments. Leave the default checkout
on `main`, aligned with `origin/main`, and preserve unrelated changes and
untracked user files.
