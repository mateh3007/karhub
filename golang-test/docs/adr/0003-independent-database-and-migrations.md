# ADR 0003: Independent database and migrations

**Status:** Accepted

## Context

Both backends run against the same `postgres` container in the root `docker-compose.yml`, but they don't share a schema definition language: `node-js-test` owns its schema via Prisma migrations, this project owns its schema via `golang-migrate` SQL files. Pointing both at the same `karhub` database would mean one of the two migration tools has to defer to the other, and a schema drift in either would silently break the other backend.

## Decision

`golang-test` runs against its own database, `karhub_go`, created on a fresh Postgres volume by `deploy/postgres-init/001-create-karhub-go-database.sql` (mounted into `/docker-entrypoint-initdb.d`), with its own migrations in `migrations/` applied by a dedicated `golang-migrate` one-off compose service — the same role `node-migrate` plays for the Node backend, just pointed at a different database.

## Rationale

- Each backend's migration tool stays the single source of truth for its own schema; neither has to reason about, or avoid breaking, tables it doesn't own.
- The two schemas are intentionally near-identical (same tables, same columns, same indexes — see the parity checklist in the root planning notes) but not literally shared, so either backend can evolve its schema independently without a migration in one tool needing to be replayed in the other.
- Postgres's official image only auto-creates one database (via `POSTGRES_DB`), so a second, empty database needs an explicit init script — a well-documented pattern for this image, not a custom workaround.

## Consequences

- On a Postgres volume that already existed before this database was introduced, the init script won't run (it only fires on first initialization of an empty data directory) — creating `karhub_go` there needs one manual `CREATE DATABASE karhub_go;`, documented in the init script's own comment and in the root README.
- Native Postgres `UUID` columns are used for every id (unlike Prisma's `TEXT` id columns), which is the more idiomatic choice for a hand-written Postgres schema — compensated by validating the `:id` route param as a UUID at the Gin handler layer (`httputil.ParseUUIDParam`) before it ever reaches SQL, mirroring what Nest's `ParseUUIDPipe` does for the same reason.
