# Eye O Ewe website

This repository contains the public Eye O Ewe website. The mobile app is out
of scope and remains in its separate repository.

The deployable source is under [`public/`](public/). This is a static site with
no application build step. The public domain is <https://eyeoewe.app/>.

## Quickstart

From the repository root:

```bash
npm ci
npm test
```

To preview the site locally, run a static server and open its printed URL:

```bash
python3 -m http.server 4173 --directory public
```

For the repository contracts and workflow, read:

- [PRODUCT.md](PRODUCT.md) for the public product boundary;
- [ARCHITECTURE.md](ARCHITECTURE.md) for the technical contract;
- [CONTRIBUTING.md](CONTRIBUTING.md) for task, branch, worktree, and PR workflow;
- [RELEASE.md](RELEASE.md) for Pages publication and verification; and
- [AGENTS.md](AGENTS.md) for coding-agent rules.

Normal production publication happens when the reviewed change is merged to
protected `main`. See [RELEASE.md](RELEASE.md) for the Cloudflare Pages model
and the separate manual recovery path.
