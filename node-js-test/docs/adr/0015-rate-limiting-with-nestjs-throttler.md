# ADR 0015: Rate limiting with `@nestjs/throttler`

**Status:** Accepted

## Context

None of the challenge's endpoints had any protection against abuse — a single client could hammer `GET /restock/priorities` or brute-force `POST /auth/login` with unlimited requests. `@nestjs/throttler` is NestJS's own rate-limiting module and plugs into the same guard mechanism already used by `JwtAuthGuard`/`RolesGuard`.

## Decision

- `ThrottlerModule.forRoot([{ name: 'default', ttl: THROTTLE_TTL_MS, limit: THROTTLE_LIMIT }])` registers one named profile, defaulting to 100 requests per 60s per IP, configurable via env vars.
- `ThrottlerGuard` is bound globally via `APP_GUARD`, so every route is covered without needing `@UseGuards(ThrottlerGuard)` repeated on each controller — consistent with how validation is wired globally in `main.ts`. As a global guard it runs before the controller-level `JwtAuthGuard`/`RolesGuard`, which is the right order: a client that's already being rate-limited shouldn't also pay the cost of a JWT verification.
- `AuthController` overrides the profile with `@Throttle({ default: { limit: 20, ttl: 60000 } })` — tighter than the global default, since `/auth/login` and `/auth/register` are the two routes most worth protecting against brute-force/credential-stuffing and spam signups specifically. NestJS Throttler keys its counters by `(throttler name, controller, handler, IP)`, so this override only affects these two routes; every other endpoint keeps the global 100/60s budget.
- Storage is the package's default in-memory `ThrottlerStorageService` — per-process, resets on restart, and doesn't share counters across multiple app instances. Fine for a single instance; a real multi-instance deployment would need a shared store (e.g. a Redis-backed `ThrottlerStorage` implementation — this project already has `RedisService` wired in, so that's a natural next step, not implemented here since there's no multi-instance deployment to justify it).

## Consequences

Verified against the running app, not just configured: 19 wrong-password login attempts in a row returned `401`, the 20th onward returned `429` with a `Retry-After` header, while `GET /docs` (a different route) kept responding `200` throughout — confirming the auth override doesn't bleed into other endpoints. The e2e suite has a dedicated test asserting the same behavior (`test/app.e2e-spec.ts`, deliberately last in the file since it exhausts the login bucket for the run). The chosen defaults (100/60s global, 20/60s auth) were sized with headroom over the e2e suite's own request volume (it makes roughly a dozen requests across all tests) so the suite doesn't trip its own rate limits.
