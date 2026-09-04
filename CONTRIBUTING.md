# Contributing to the Eye O Ewe website

This is a small static-site repository. Keep work issue-led, narrow, and easy
to verify. GitHub Issues are the work queue. Pull requests contain the
implementation, verification, review, and merge evidence. Do not create a
Markdown backlog, orchestrator, or current-task pointer.

## Start a task

Non-trivial work starts with a GitHub Issue that states the outcome and scope.
Use one task branch and one worktree. Before creating either, inspect the
website checkout and preserve any existing user-owned changes.

From the website repository root:

```bash
git fetch origin
git rev-parse --verify refs/remotes/origin/main
```

The second command must return the current full `origin/main` SHA. Record that
SHA as the task base, then create the worktree from that exact commit:

```bash
git worktree add -b codex/<short-slug> /path/to/eyeoewedotapp-<short-slug> <exact-origin-main-sha>
```

Never start from local `main`, even when it appears to match. If the fetch or
the `origin/main` resolution fails, stop and report the unavailable remote
state.

## Scope and preservation

- Change only the website files needed for the issue.
- Keep deployable source under `public/` and keep app source, backend code,
  credentials, personal data, generated output, and signing material out.
- Do not change product messaging, legal or policy content, Cloudflare
  settings, GitHub rules, or hosted services unless the task explicitly
  authorises that work.
- Treat staged, unstaged, and untracked files as user-owned. Do not reset,
  clean, overwrite, or broadly stage them. Stage explicit paths only when a
  commit is requested.

## Development and review

For user-facing changes, serve `public/` locally and obtain product-owner
visual review at mobile and desktop sizes. Record visual review separately
from automated checks.

Before requesting a PR, run from the task worktree:

```bash
npm ci
npm test
node --check scripts/deploy-public-pages.mjs
node --check tests/deploy-public-pages.test.mjs
node --check tests/public-pages.test.mjs
git diff --check
git status --short
```

Review the complete diff, confirm the issue scope, and record unavailable
checks explicitly. Local checks do not prove a GitHub merge, a Pages
deployment, or a live response.

## Pull requests and `main`

Ask the owner before pushing or opening or updating a PR. The PR must link the
Issue, state the scope and safety boundary, identify the exact reviewed
commit, and include tests, visual review, hosted evidence, and unavailable
checks. Use the repository PR template.

Before opening or updating the PR, fetch `origin` again and resolve
`refs/remotes/origin/main`. Compare it with the recorded task base. If
`origin/main` moved, reconcile the task branch before final verification:

- rebase an unpublished branch onto the new `origin/main`; or
- for an already-published branch, prefer a normal update that does not rewrite
  remote history. Do not force-push without separate owner approval.

Resolve conflicts semantically within the issue scope. If a conflict changes
product, legal, deployment, or ownership meaning, stop and ask. Re-run the
full verification after reconciliation. The PR branch must be up to date with
protected `main`, and the required `Test website` check must pass before
merge.

Merging to `main` is a separate owner decision and is also the normal public
release authorization. See [RELEASE.md](RELEASE.md). Branch and worktree
cleanup after merge is separately authorized; do not infer it from merge or
deployment approval.
