# ADR 0001: Clean Architecture layering

**Status:** Accepted

## Context

The challenge is explicitly evaluated on domain modeling clarity, separation of responsibilities, and "uso adequado de camadas (ex: Controller, Service, Domain, Repository)". Node/NestJS does not enforce any particular architecture on its own — left unstructured, business rules tend to leak into controllers or directly into ORM models, which also makes them hard to unit test without booting the whole framework.

## Decision

The codebase under `src/` is split into four layers, with dependencies pointing inward:

- `domain/` — entities with their own business rules as methods (e.g. `PartEntity.urgencyScore()`), abstract repository contracts, and plain input/output interfaces. Depends on nothing else in the project.
- `application/` — one usecase class per operation (`CreatePartUseCase`, `GetRestockPrioritiesUseCase`, ...), orchestrating domain entities and repository interfaces. Cross-cutting pure logic that doesn't belong to a single entity (e.g. sorting/tie-breaking a list of parts) lives in `application/services/`.
- `infra/` — everything that depends on a concrete framework or database: Prisma repository implementations, the `PrismaService`, HTTP guards, decorators.
- `presentation/` — NestJS controllers and DTOs (the HTTP boundary).

Usecases and domain code only ever import abstract repository classes, never Prisma types directly.

## Consequences

Business logic (the restock priority calculation, tenant-scoping rules, duplicate-email checks, etc.) is unit-testable with plain Jest, without an HTTP server or a database — see ADR 0010. Swapping the persistence technology only touches `infra/`, per the challenge's requirement that the solution "permita futura troca de banco de dados" (see ADR 0004).

The cost is more files per feature — one usecase class per CRUD operation instead of one fat service class — which is a deliberate trade favoring clarity and testability, matching what the challenge explicitly grades, over a lower file count.
