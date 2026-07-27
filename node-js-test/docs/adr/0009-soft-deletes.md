# ADR 0009: Soft deletes via deletedAt

**Status:** Accepted

## Context

`BaseEntity` models every record with a `deletedAt: Date | null` field. "Remover peça" (and removing a company or user) needed a concrete deletion strategy consistent with that field actually being used.

## Decision

Every Prisma repository's `delete(id)` sets `deletedAt` to the current timestamp instead of removing the row. Every read method (`findById`, `findAll`, `findByCompanyId`, `findByIdAndCompanyId`, the various `findByX` lookups) filters `deletedAt: null`.

## Consequences

Deleted records remain in the database, recoverable and auditable, instead of being destroyed outright — useful for a business record like a part or a company. The cost is that every new query added to a repository must remember the `deletedAt: null` filter; forgetting it would silently leak "deleted" rows back into results. This is a known sharp edge worth flagging in code review for any new repository method.
