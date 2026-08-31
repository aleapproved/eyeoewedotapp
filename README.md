# Eye O Ewe website

This repository contains the static public website for Eye O Ewe. The mobile
app remains in its existing app repository.

## Website source

The complete deployable site is under public/. It has no build step,
analytics, tracking, account data, or server-side code.

The published routes are:

- https://eyeoewe.app/
- https://eyeoewe.app/eyeoewe/v1/privacy/
- https://eyeoewe.app/eyeoewe/v1/support/
- https://eyeoewe.app/eyeoewe/v1/delete-account/

## Local check

From the repository folder, run:

    npm test

This checks the required pages, branding, links, static-only boundary, and
deployment target rules.

For a local browser preview, serve public/ with any static-file server. For
Cloudflare Pages deployment, follow docs/public-pages-deploy.md.
