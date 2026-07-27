# ADR 0002: NestJS as the HTTP framework

**Status:** Accepted

## Context

The challenge allows Node.js with TypeScript, with framework choice left open — from a minimal setup on raw Express/Fastify to a full "batteries-included" framework. This project was scaffolded with NestJS before the architectural work documented in the rest of these ADRs began.

## Decision

Keep NestJS as the HTTP framework and build the rest of the architecture (usecases, repositories, guards) as NestJS providers wired through its dependency injection container.

## Rationale

- NestJS's module/provider/DI system maps directly onto the layering in ADR 0001: usecases, repository implementations, and guards are just injectable classes, and swapping an implementation (e.g. `CompanyRepository` → `CompanyPrismaRepository`) is a one-line change in `app.module.ts`.
- Decorators from `class-validator` and `@nestjs/swagger` give request validation and OpenAPI documentation with very little hand-written glue code (see the DTOs under `presentation/dtos/`).
- It is the most common "full framework" choice in the current Node ecosystem for exactly this kind of layered, testable backend, which keeps the amount of hand-rolled wiring (routing, dependency wiring, request parsing) low compared to composing raw Express/Fastify plus a DI library by hand.

## Consequences

There is more upfront "magic" to understand than a minimal Express app (decorators, DI, module boundaries), and a steeper learning curve for anyone unfamiliar with Nest. In exchange, cross-cutting concerns (validation, guards, Swagger, DI) come largely for free and stay consistent across every controller in the project.
