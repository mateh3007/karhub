# ADR 0003: PostgreSQL + Prisma, with a driver adapter

**Status:** Accepted

## Context

A real database was chosen over an in-memory store to demonstrate a production-realistic setup, while keeping local setup as close to a single command as possible for whoever runs this project.

## Decision

- **PostgreSQL**, run via `docker-compose.yml` — one `docker compose up -d` gives a working database with no local Postgres install required.
- **Prisma** as the query layer/ORM, using the classic `prisma-client-js` generator — not the newer `prisma-client` generator that Prisma 7 defaults to.
- An explicit driver adapter, `@prisma/adapter-pg` (backed by the `pg` package), passed into `PrismaClient`'s constructor.

## Why not the default `prisma-client` generator

Prisma 7's new default generator emits ESM-native code (it uses `import.meta.url` internally). That is incompatible with this project's CommonJS module system (NestJS's default `tsc`-based build) — the generated client crashed at runtime with `ReferenceError: exports is not defined in ES module scope` when required from compiled CommonJS output. Switching the `generator client` block in `prisma/schema.prisma` back to `provider = "prisma-client-js"` produces a client that behaves like Prisma always has in a CJS/NestJS project.

## Why a driver adapter is required at all

Prisma 7 removed its bundled query engine binary. `new PrismaClient()` with no adapter now throws `PrismaClientInitializationError: PrismaClient was instantiated without any options. A driver adapter is required to connect to your database.` — this is a hard requirement, not an opt-in performance feature like it was in earlier Prisma versions. `PrismaService` (in `infra/database/prisma.service.ts`) therefore constructs the client as `new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })`.

## Consequences

Anyone extending this code (or following an older Prisma tutorial) needs to know both of the above, since most existing Prisma documentation and examples predate this behavior. In exchange, the project runs on a real, disposable Postgres instance that any evaluator can start with one command, and gets the type-safe query builder and migration tooling (`prisma migrate dev`) that a hand-written SQL layer would not provide for free.
