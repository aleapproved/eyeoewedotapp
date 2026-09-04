# Eye O Ewe website release contract

## Normal production release

Cloudflare Pages is connected to this GitHub repository and automatically
deploys the production site when `main` changes. The repository workflow in
`.github/workflows/ci.yml` runs the `Test website` check; it does not run a
production deployment.

The normal sequence is:

1. Complete the Issue-scoped change in a task branch and PR.
2. Confirm the PR is up to date with protected `main` and `Test website` is
   successful.
3. The owner reviews and approves the merge.
4. Merge to `main`. That merge triggers the Pages production deployment and
   is the authorization for the public release.
5. Perform post-deploy verification and record the evidence.

There is no second post-merge production approval in this normal path. Do not
run the manual Wrangler production helper as a routine second release step.

Before opening or updating a PR, follow the exact fetched `origin/main` base and
reconciliation rule in [CONTRIBUTING.md](CONTRIBUTING.md). This release
contract depends on the reviewed branch being current and verified there.

## Post-deploy verification

Post-merge work is verification, not another release authorization. Confirm
the following from read-only evidence:

- the merged commit on `main`;
- the Pages deployment identifier and URL;
- selected branch `main` and the deployed commit;
- `https://eyeoewe.app/` uses HTTPS and returns the expected successful root
  response;
- the custom domain serves the expected stylesheet and brand asset;
- the response includes the security headers defined in `public/_headers`,
  including the CSP, `Permissions-Policy`, `Referrer-Policy`,
  `X-Content-Type-Options`, and `X-Frame-Options`; and
- a reserved `/eyeoewe/v1/...` route returns the configured redirect to `/`.

For example, inspect headers without following the redirect:

```bash
curl -fsSI https://eyeoewe.app/
curl -fsSI https://eyeoewe.app/styles.css
curl -fsSI https://eyeoewe.app/app-icon.webp
curl -sS -D - -o /dev/null https://eyeoewe.app/eyeoewe/v1/example
```

Keep local tests, GitHub checks, Pages deployment records, and live HTTP
responses as separate evidence. If a hosted or account check is unavailable,
report it as unavailable rather than treating local success as deployment
proof.

## Manual Wrangler helper

The helper in `scripts/deploy-public-pages.mjs` is retained for recovery after
an automatic deployment problem, a controlled redeploy, source-identity
verification before a manual deploy, or an explicitly requested manual
fallback. It is not the normal production path.

Manual production use requires separate owner authorization, confirmation of
the exact Cloudflare account and Pages project, and a dedicated clean release
checkout separate from the implementation worktree. Immediately before the
command, all of these must be true:

- the command runs from the website repository root;
- the current branch is `main`;
- `HEAD` and `refs/heads/main` equal the supplied full 40-character reviewed
  SHA;
- a read-only `git ls-remote` check resolves `origin/main` to that same SHA;
- the checkout has no tracked or untracked changes; and
- the intended source is the reviewed `public/` tree.

Use the confirmed project name and reviewed full SHA:

```bash
npm run deploy:production -- \
  --project-name <confirmed-eyeoewe-pages-project> \
  --commit <reviewed-main-sha>
```

The helper uploads only `public/` and forces the production Pages branch to
`main`. A preview is a separate, explicitly requested manual action and must
use a named non-`main` branch:

```bash
npm run deploy:preview -- \
  --project-name <confirmed-eyeoewe-pages-project> \
  --branch <named-preview-branch>
```

Do not guess an account or project, store credentials in the repository, or
record account identifiers or tokens in GitHub or repository files.

## Cleanup boundary

Deleting a merged branch, worktree, or preview deployment is a separate
owner-authorized action. Merge, automatic deployment, or post-deploy
verification does not authorize cleanup. Preserve unrelated branches and
user-owned untracked files.
