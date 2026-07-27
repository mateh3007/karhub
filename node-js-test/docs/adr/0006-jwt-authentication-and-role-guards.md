# ADR 0006: JWT authentication via @nestjs/jwt, with a custom RolesGuard

**Status:** Accepted

## Context

Requests need to be authenticated, and some operations (creating/updating/deleting companies, users, and parts) must be restricted to `ADMIN` users, while reads stay open to any authenticated user within their own company.

## Decision

- `@nestjs/jwt` directly for signing (`LoginUseCase`) and verifying tokens — not `@nestjs/passport` + `passport-jwt`.
- `JwtAuthGuard`: reads the `Authorization: Bearer <token>` header, verifies it with `JwtService.verifyAsync`, and attaches the decoded payload (`sub`, `email`, `role`, `companyId`) to `request.user`.
- `RolesGuard`: reads role metadata set by a `@Roles(...)` decorator (via `Reflector`); if a route has no `@Roles(...)`, any authenticated user passes. If it does, `request.user.role` must be in the list, or the guard throws `ForbiddenException`.
- Both guards are applied at the controller level (`@UseGuards(JwtAuthGuard, RolesGuard)`), with `@Roles(RoleEnum.ADMIN)` added only to the mutating routes.

## Why not Passport

This project has exactly one authentication mechanism (a bearer JWT) and no plan for others (no OAuth, no sessions, no API keys). Passport's strategy/session abstractions solve a problem — supporting and composing multiple auth strategies — that doesn't exist here yet. The hand-written `JwtAuthGuard` is about twenty lines and reads end to end without needing to trace through a strategy registration flow.

## Consequences

Fewer dependencies and less indirection for the current scope. If a second authentication strategy is ever needed, Passport's strategy pattern would likely become worth the added dependency and abstraction at that point — this decision should be revisited if that happens.
