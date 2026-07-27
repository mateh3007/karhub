# ADR 0013: CI/CD pipeline (GitHub Actions), deploy left unconnected on purpose

**Status:** Accepted

## Context

The challenge doesn't ask for a live deployment, and this project genuinely doesn't have a server, database, or hosting account to deploy to. What's worth demonstrating instead is that the pipeline itself is correctly designed — a real CI gate on every push, and a CD pipeline that goes as far as it can *without* provisioning or paying for any external infrastructure, wired so that turning it on later is a matter of adding secrets, not writing new automation.

## Decision

Two workflows, both scoped to `node-js-test/**` via `paths:` filters (so they don't fire once `golang-test/` grows its own pipeline):

- **`node-ci.yml`** — runs on every push and PR. Boots real `postgres:16-alpine` and `redis:7-alpine` service containers (the same versions as `docker-compose.yml`), then: install → lint → `prisma generate` → build → unit tests → `prisma migrate deploy` → e2e tests. Nothing here is a stub; every step is something this repo already runs locally, and it needs zero secrets to pass.
- **`node-deploy.yml`** — runs on push to `main`. Job 1 (`build-and-push-image`) builds the `Dockerfile` and pushes it to `ghcr.io/<repo>/node-js-test`, tagged `latest` and by commit SHA, authenticated with the automatically-provided `GITHUB_TOKEN` — this actually runs and actually works, no external account needed, because GHCR is part of the same GitHub repo. Job 2 (`deploy`) has two steps guarded by `if: secrets.X != ''`: run pending migrations against `PROD_DATABASE_URL`, and POST to a `DEPLOY_HOOK_URL` (the generic "redeploy" webhook pattern used by Render/Railway/Fly/etc.). Neither secret is set on this repo, so both steps are skipped and a final step just logs that the image was published with no live target touched.

## Consequences

Cloning this repo and pushing to it exercises a genuine, currently-green CI pipeline and publishes a real (if unused) Docker image — nothing here is decorative. Making the CD job actually deploy somewhere later requires exactly two repo secrets (`PROD_DATABASE_URL`, `DEPLOY_HOOK_URL`); no workflow changes, no new code.

Setting this up surfaced two pre-existing issues that would otherwise have made `node-ci.yml` red from the first run, fixed alongside it: `package.json`'s `start:prod` pointed at `dist/main` when the actual build output is `dist/src/main.js` (Nest's compiler mirrors the `src/` layout since the project has no `rootDir` override), and `npm run lint` was failing outright on `@typescript-eslint/unbound-method` (jest mock methods referenced via `expect(mock.method).toHaveBeenCalledWith(...)`, a well-known false positive with this rule) and `no-unsafe-*` (supertest's `response.body` is typed `any`) — both now scoped off for `*.spec.ts`/`test/**` in `eslint.config.mjs`, since they're inherent to how jest and supertest work, not real bugs.
