# Working agreement

This is the Eye O Ewe website repository. The mobile app is a separate
repository and is never part of website work.

Read [README.md](README.md), [PRODUCT.md](PRODUCT.md),
[ARCHITECTURE.md](ARCHITECTURE.md), and [CONTRIBUTING.md](CONTRIBUTING.md)
before editing. Read [RELEASE.md](RELEASE.md) before any deployment-related
work.

- Work only on the requested website issue and preserve all user-owned changes.
- Before creating a task branch or worktree, fetch `origin`, resolve the full
  `origin/main` SHA, and create the task from that SHA. Never use local `main`
  as a substitute. Record the base SHA. If `origin/main` cannot be read, stop.
- Use one task, one `codex/<short-slug>` branch, and one worktree. Do not add
  Markdown backlogs, orchestrators, or current-task pointers.
- Keep app source, backend code, credentials, personal data, generated output,
  and signing material out of this repository. Do not change hosted settings,
  GitHub rules, legal content, or product scope without explicit authority.
- Run the checks in [CONTRIBUTING.md](CONTRIBUTING.md), review the complete
  diff, and keep local, GitHub, Pages, and live-site evidence separate.
- Before opening or updating a PR, fetch again and compare `origin/main` with
  the recorded base. Reconcile any movement before final verification. Never
  silently overwrite newer mainline work.
- Stop and ask when a required check, owner decision, credential, external
  account, hosted service, or destructive action is needed.
