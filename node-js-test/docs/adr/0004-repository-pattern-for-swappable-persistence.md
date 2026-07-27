# ADR 0004: Repository pattern for swappable persistence

**Status:** Accepted

## Context

The challenge explicitly requires that "a solução deve permitir futura troca de banco de dados", and that the priority calculation must not depend on how or where data is stored.

## Decision

Every aggregate (`Company`, `User`, `Part`) has:

- An **abstract repository class** in `domain/repositories/` (e.g. `PartRepository`), extending a generic `BaseRepository<T>` that declares `create`, `findById`, `findAll`, `update`, `delete`. Aggregate-specific lookups (`findByCompanyId`, `findByCnpj`, `findByEmail`, ...) are added as extra abstract methods on the specific repository.
- A **concrete Prisma implementation** in `infra/database/repositories/` (e.g. `PartPrismaRepository`), which maps between the Prisma row shape and the domain entity via a private `toDomain()` method.

`app.module.ts` binds the abstract token to the concrete class: `{ provide: PartRepository, useClass: PartPrismaRepository }`. Usecases depend on the abstract class only, injected by NestJS's DI container.

## Consequences

Swapping Postgres/Prisma for another database means writing one new class implementing the same abstract repository — no changes to any usecase, controller, or domain entity. This was exercised in practice: usecase unit tests (ADR 0010) run against hand-written Jest mocks of these same repository interfaces, with zero Prisma or database involvement.

The cost is one abstract class per aggregate and a hand-written mapping function per concrete repository, instead of using the Prisma-generated types directly throughout the codebase.
