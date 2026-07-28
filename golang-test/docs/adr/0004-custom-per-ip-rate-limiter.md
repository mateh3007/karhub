# ADR 0004: Custom per-IP rate limiter

**Status:** Accepted

## Context

`node-js-test` uses `@nestjs/throttler` for rate limiting (ADR 0015 there): 100 requests/60s globally per IP, with `/auth/register` and `/auth/login` overridden to a stricter 20/60s. Go has no equivalent drop-in "Nest Throttler" package with the same route-decorator ergonomics, but `golang.org/x/time/rate` provides the underlying primitive (a token-bucket limiter) needed to build one.

## Decision

Implement rate limiting as a small hand-written Gin middleware (`internal/presentation/middleware/rate_limit.go`): a `RateLimiter` holding one `*rate.Limiter` per client IP in a mutex-guarded map, constructed with the same two thresholds as Node (`NewRateLimiter(100, 60s)` applied globally, `NewRateLimiter(20, 60s)` applied only to the `/auth` route group, not stacked with the global one) — mirroring Nest's per-route override rather than adding to it.

## Rationale

- `x/time/rate` is the standard, well-tested rate-limiting primitive in Go's extended standard library — reusing it means the only custom code is the per-IP bookkeeping and the Gin middleware glue, not the limiting algorithm itself.
- Keeping the two-tier shape (global limiter + a stricter override on `/auth/*`, not layered on top of the global one) matches the *observable* behavior a client sees in both backends, which is what actually matters for parity: hit `/auth/login` too fast, get `429` well before the global threshold would trigger.

## Consequences

`x/time/rate` is a token-bucket limiter, while Nest's Throttler is closer to a fixed-window counter — the two algorithms don't behave identically at the margin (e.g. exact burst-then-refill timing). This is a disclosed, intentional difference: both were verified live to produce the same threshold behavior that matters for the challenge (N requests allowed, the next one `429`, recovering after the window), not a claim that the internal algorithms are identical.
