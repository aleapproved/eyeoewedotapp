# Website architecture

- This repository is a static website. All deployable source lives under
  `public/`.
- There is no framework or application build system. The site is served from
  the checked-in files in `public/`, and `npm test` is the local website gate.
- Cloudflare Pages publishes the static site. The normal production source is
  the protected `main` branch through the connected Git integration.
- `public/_headers` defines the static security headers. `public/_redirects`
  defines the reserved legacy-route redirect. Keep both in the deployed
  `public/` tree.
- Static assets belong under `public/` and are referenced by stable,
  root-relative paths. Do not add generated build output or local tooling
  state to the deployable tree.
- The website has no backend, account data, runtime application code, or
  tracking.

## Deployment invariants

Merging an approved change to `main` is the normal production publication
path. The repository CI workflow runs tests; it is not a second deployment
mechanism.

The manual Wrangler helper is retained for recovery, a controlled redeploy,
source-identity verification before a manual deploy, or an explicitly
requested fallback. It is not an equivalent normal release path. Its
production safeguards require a confirmed project, a full reviewed
SHA, a clean website checkout on `main`, matching `HEAD` and local `main`, and
an exact read-only `origin/main` check. It uploads only `public/` and targets
the Pages `main` branch. Preview deployments require a named non-`main`
branch. The complete procedure is in [RELEASE.md](RELEASE.md).
