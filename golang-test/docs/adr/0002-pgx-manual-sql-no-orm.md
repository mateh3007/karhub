# ADR 0002: pgx with hand-written SQL, no ORM

**Status:** Accepted

## Context

`node-js-test` uses Prisma (ADR 0003 there) precisely because Node's ecosystem makes a type-safe query builder the path of least resistance. Go's most Prisma-like equivalents (ent, GORM) trade away exactly what this project's `internal/domain/repository` interfaces are designed around: a repository whose concrete implementation is swappable behind a plain interface (mirroring ADR 0004 in `node-js-test`), with the query shape fully visible and controllable.

## Decision

Use `github.com/jackc/pgx/v5` (with `pgxpool` for connection pooling) directly, with every `CompanyRepository`/`UserRepository`/`PartRepository` implementation in `internal/infra/postgres` written as plain parameterized SQL — no ORM, no query builder, no code generation step.

## Rationale

- The repository interfaces in `internal/domain/repository` are small and hand-picked to what the usecases actually call (`FindByIDAndCompanyID`, `FindPageByCompanyID`, ...) — an ORM's generated model layer would add a translation step between "what the interface promises" and "what the query does" that this project doesn't need.
- Every tenant-scoping and soft-delete rule (`WHERE company_id = $1 AND deleted_at IS NULL`) is visible directly in the SQL, in the same place a reviewer already has to look to verify ADR 0005's (from `node-js-test`) isolation guarantees — no ORM-generated query to cross-check against.
- pgx is the de facto standard low-level Postgres driver in Go (faster and more actively maintained than `database/sql` + `lib/pq`), so this isn't a homegrown driver choice — only the query-writing style is manual.

## Consequences

Every new query is hand-written, including basic paging (`LIMIT`/`OFFSET`) and the optional-filter dynamic `WHERE` clause in `PartRepository.FindPageByCompanyID` — there's no generated query builder to fall back on. This is an explicit trade: more lines of SQL per repository method, in exchange for no ORM abstraction sitting between the interface and the database.
