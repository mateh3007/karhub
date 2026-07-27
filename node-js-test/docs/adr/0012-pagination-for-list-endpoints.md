# ADR 0012: Pagination for list endpoints

**Status:** Accepted

## Context

The challenge requires the system to "suportar centenas ou milhares de peças". Returning every row of `GET /parts`, `GET /users` or `GET /restock/priorities` in one response doesn't hold up at that scale — the same `page`/`limit` contract is applied to all three list endpoints for consistency, even though each satisfies it differently underneath.

## Decision

- A generic `IPaginationParams { page, limit }` / `IPaginatedResult<T> { data, total, page, limit, totalPages }` pair lives in `shared/interfaces/pagination.interface.ts` — a cross-cutting concern like `BaseEntity`/`BaseRepository`, not owned by any one aggregate.
- `page`/`limit` are validated and defaulted (`page` ≥ 1, `1 ≤ limit ≤ 100`, defaulting to `1`/`20`) by a shared `PaginationQueryDto`, extended by each resource's query DTO (`FindPartsQueryDto`, `FindUsersQueryDto`, `RestockPrioritiesQueryDto`).
- **`GET /parts` and `GET /users` paginate at the database.** `PartRepository.findPageByCompanyId` / `UserRepository.findPageByCompanyId` use Prisma `skip`/`take` plus a `count` of the same `where` clause, ordered by `name` for a stable, browsable order. This is the actual point of pagination here: never load more than one page of rows into memory.
- **`GET /restock/priorities` paginates in memory, over the already-computed, already-cached full list.** Its ordering (`urgencyScore` descending, tie-broken by criticality/sales/name) isn't a column Postgres can sort by — it only exists after `PartPriorityService` runs over every part needing restock. `GetRestockPrioritiesUseCase` therefore keeps computing and caching the *entire* sorted result per company (as decided in ADR 0011), and slices `[  (page-1)*limit, page*limit )` out of that array after it's fetched from cache or freshly computed. One cache entry still serves every page.
- `PartRepository.findByCompanyId` (the unpaginated, full-list method) is kept alongside the new `findPageByCompanyId` specifically because `GetRestockPrioritiesUseCase` needs the complete set to sort correctly — it is not dead code left over from before pagination.

## Consequences

`GET /parts` and `GET /users` scale independently of how many rows a company has — the database does the filtering, not the application. `GET /restock/priorities` still computes over every part needing restock on a cache miss (bounded by the 30s TTL from ADR 0011, not by page size), which is the right trade-off given the ranking can't be produced any other way; pagination there only bounds the size of the HTTP response, not the computation.

The cost is `IFindAllParts`/`IFindAllUsers`/`IGetRestockPriorities` all carry `page`/`limit` now, and `PartRepository` carries two list methods with different contracts (`findByCompanyId` vs `findPageByCompanyId`) instead of one — a deliberate asymmetry, not an oversight, documented here so it isn't "cleaned up" into a single method later.
