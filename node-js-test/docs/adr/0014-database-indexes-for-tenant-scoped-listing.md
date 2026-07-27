# ADR 0014: Database indexes for tenant-scoped, sorted listing

**Status:** Accepted

## Context

Every list query on `Part` and `User` (`findByCompanyId`, `findPageByCompanyId`, `findByIdAndCompanyId`) filters by `companyId` first — that's the tenant boundary from ADR 0005 — and, since ADR 0012 added pagination, also sorts by `name` at the database level. `User` had no index on `companyId` at all: every company-scoped query on it was a full table scan. `Part` had `@@index([companyId])` and `@@index([companyId, category])`, neither of which helps Postgres avoid a separate sort step for `ORDER BY name`.

## Decision

- `User` gets `@@index([companyId, name])`. This is the only index it needs: a composite index's leading column serves plain `WHERE companyId = ?` lookups just as well as a standalone `@@index([companyId])` would (B-tree prefix matching), while also letting `ORDER BY name` after that filter be satisfied directly from the index, with no separate sort step.
- `Part` gets the same `@@index([companyId, name])` added, **and drops the now-redundant standalone `@@index([companyId])`** — once `(companyId, name)` exists, a bare `(companyId)` index adds write overhead (one more index to maintain on every insert/update/delete) without serving any query that the composite index doesn't already cover via prefix. `@@index([companyId, category])` stays, since it's the one that helps when `GET /parts?category=` is used with a category `Part` doesn't otherwise have covered.

## Consequences

Verified against Postgres directly, not just asserted: with the tables near-empty, `EXPLAIN` correctly showed a sequential scan (the right call for a handful of rows — an index would only add overhead). After seeding 5,000 rows into `parts` for one company and running `ANALYZE`, the same paginated query switched to `Index Scan using "parts_companyId_name_idx"`, returning a page with zero sort step (0.054ms). That table was left as it was before the experiment — the seeded rows were deleted afterward.

The cost is one more index to maintain per write on `parts` and `users` each; worth it given every request in the system is tenant-scoped by `companyId`, and listings now sort at the database instead of pulling every row into the app to sort in memory.
