# ADR 0010: Unit tests with mocked repositories + a real e2e smoke test

**Status:** Accepted

## Context

"Testes automatizados" is an explicit deliverable, and "testes de cenários extremos (estoque negativo, venda zero, lead time alto)" for the priority calculation specifically is called out as evaluated.

## Decision

Two layers of tests:

1. **Unit tests** for every entity's business logic and every usecase, colocated as `*.spec.ts` next to the source file. Repository dependencies are hand-written Jest mocks (`jest.Mocked<XRepository>`), never a real database, NestJS testing module, or HTTP layer — each test targets one unit of logic. `PartEntity` and `PartPriorityService` specifically get exhaustive edge-case coverage: negative projected stock, zero average daily sales, a 365-day lead time, criticality at both boundaries (1 and 5), the exact `projectedStock === minimumStock` boundary, and all three tie-break levels in isolation.
2. **One e2e suite** (`test/app.e2e-spec.ts`) that boots the real `AppModule` against the real Postgres container and drives actual HTTP endpoints with `supertest`: register → login → create a part → verify it is correctly prioritized in `GET /restock/priorities` with the exact expected `projectedStock`/`urgencyScore`, plus a cross-role authorization check (a `USER` gets `403` creating a part). This replaced NestJS's default scaffolded e2e test, which asserted on a `GET /` endpoint that no longer exists in this project.

## Consequences

The unit suite (69 tests as of this writing) runs in about a second with no external dependencies, directly exercising the extreme cases the challenge calls out. The e2e suite needs Postgres running (`docker compose up -d`) first, and is the only place where environment variables must be loaded explicitly (`import 'dotenv/config'` at the top of the spec file) — `Test.createTestingModule` bypasses `main.ts`, so without that import the suite fails with a confusing Postgres authentication error (`SASL: ... client password must be a string`) rather than a clear "missing DATABASE_URL" message. Both `package.json`'s Jest config and `test/jest-e2e.json` also needed a `modulePaths` entry, since Jest does not resolve this project's `"src/..."` absolute imports the way `tsc`'s `baseUrl` does by default.
