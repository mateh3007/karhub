# ADR 0007: Isolate the restock priority calculation from HTTP

**Status:** Accepted

## Context

The challenge explicitly requires that "o cálculo de prioridade deve estar isolado da camada HTTP", and that the tie-break rule (criticality → average daily sales → name) be correct and verifiable on its own.

## Decision

- `expectedConsumption()`, `projectedStock()`, `needsRestock()`, and `urgencyScore()` are methods on `PartEntity` itself, reading only the entity's own fields — no repository, HTTP, or Prisma dependency.
- The filter-then-sort orchestration, including the three-level tie-break, lives in `PartPriorityService` (`application/services/part-priority.service.ts`): a small stateless class with two methods (`filterNeedingRestock`, `sortByUrgency`) and no constructor dependencies.
- `GetRestockPrioritiesUseCase` only wires a repository call to this service; the `RestockController` only maps the resulting entities to the response DTO shape the challenge specifies (`partId`, `name`, `currentStock`, `projectedStock`, `minimumStock`, `urgencyScore`).

## Consequences

Both the calculation and the tie-break rule are unit-tested directly, with hand-built `PartEntity` instances, without booting Nest, HTTP, or a database (see ADR 0010 and `part.entity.spec.ts` / `part-priority.service.spec.ts`). This also means the calculation is reused as-is for both the plain `GET /parts` response and the `GET /restock/priorities` response, so there is exactly one implementation of "what does this part's urgency mean" in the whole codebase.
