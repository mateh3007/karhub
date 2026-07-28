# ADR 0001: Gin as the HTTP framework

**Status:** Accepted

## Context

This is a from-scratch Go port of `node-js-test`, built to prove the same competence — same routes, same payloads, same business rules, same layering discipline (ADR 0001 in `node-js-test`) — in a second stack, not a reinterpretation of the challenge. Go's standard library `net/http` is enough to build a router, but hand-rolling path params, route groups, JSON binding, and per-route middleware composition for ~21 endpoints would mean writing a small framework before writing the actual challenge.

## Decision

Use `github.com/gin-gonic/gin` as the HTTP framework, with `internal/presentation` staying a thin translation layer over it (handlers, DTOs, middleware) — exactly like `node-js-test`'s Nest controllers stay thin over the application layer.

## Rationale

- Route groups (`router.Group("/parts")`) map directly onto the same `/companies`, `/users`, `/parts`, `/restock` groupings Nest's controllers already express, and per-group middleware (`RequireRole`, rate limiter) mirrors Nest's per-route `@UseGuards`/`@Throttle`.
- `gin.Context` gives one place to bind+validate JSON, read route/query params, and stash the JWT claims set by `JWTAuth` — the same shape as Nest's request-scoped `req.user`.
- It's the most common minimal-but-complete HTTP framework in Go for this kind of layered service, which keeps the amount of hand-written routing/binding glue low without pulling in a full "batteries-included" framework the way Nest is for Node — Go's ecosystem doesn't have an equivalent, and this codebase doesn't need one; `application`/`domain` carry all the real logic.

## Consequences

Gin's own request binding (`ShouldBindJSON`) silently accepts unknown JSON fields, unlike Nest's `forbidNonWhitelisted: true`. Matching that behavior needed a small hand-written helper (`httputil.BindStrictJSON`, using `json.Decoder.DisallowUnknownFields` + `go-playground/validator`) rather than getting it for free — a one-time cost paid in `internal/presentation/httputil`, not per-handler.
