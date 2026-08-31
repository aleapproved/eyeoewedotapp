# Working agreement

This repository contains the Eye O Ewe static website. The mobile app remains
in its separate repository.

## Scope and preservation

- Keep the complete deployable website under `public/`.
- Keep this repository limited to the website. Do not add app source, backend
  code, credentials, personal data, generated build output, or signing
  material.
- Keep published routes stable unless the product owner explicitly changes
  them.
- Before editing, inspect the current branch, worktrees, remotes, recent
  commits, and staged, unstaged, and untracked files.
- Treat every existing change as user-owned. Preserve it. Never reset, clean,
  discard, overwrite, or broadly stage changes. Stage explicit paths only.
- Work on one change per task, using one local branch and worktree where
  available. Start from the current `main` and use
  `codex/<short-slug>` for agent-created branches.

## Local-first delivery

An implementation request authorises local work only. It does not authorise
remote or hosted writes.

1. Inspect the repository and make the change on a local branch.
2. Run `npm test`, `git diff --check`, and `git status --short`.
3. For visual changes, inspect the rendered page locally at mobile and desktop
   sizes. Report visual review separately from automated tests.
4. Review the complete diff and stop with a local handoff.

Wait for explicit owner approval before any of the following:

- pushing a branch or creating or updating a pull request;
- merging a pull request;
- deploying a Pages preview or production site;
- deleting a remote branch, Pages deployment, local branch, or worktree.

Approval for one action does not authorise the next action. In particular,
merging does not authorise production deployment, and deployment does not
authorise cleanup.

## Evidence and release boundaries

Keep these states separate in every handoff:

- local files, tests, visual review, branch, and commit;
- GitHub branch, pull request, review, and merge state; and
- Cloudflare Pages deployment, selected branch and commit, and live response.

An unavailable check remains unavailable. A local test result does not prove a
GitHub merge, Pages deployment, or live URL.

Production deployment requires all of the following:

- explicit owner approval to publish;
- the reviewed change merged to `main`;
- confirmation of the exact Cloudflare account and Pages project; and
- verification of the resulting Pages deployment and `https://eyeoewe.app/`
  response.

Use the deployment commands in `README.md`. They deploy only `public/`, force
production to the confirmed Pages `main` branch, and require a named non-main
branch for previews.

## Stop and ask

Pause and ask the owner when the requested change expands scope, a required
check is unavailable, or an external account, credential, hosted project,
domain, DNS record, or destructive action is required. Do not guess an
environment or delete anything that has not been explicitly identified.
