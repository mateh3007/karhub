# ADR 0011: Generic cache adapter, used to cache restock priorities

**Status:** Accepted

## Context

Redis was already wired into the project (`infra/redis/RedisService`, `docker-compose.yml`) but nothing used it — dead infrastructure with no payoff. At the same time, `GET /restock/priorities` recomputes `expectedConsumption`/`projectedStock`/`urgencyScore` and re-sorts the full company inventory on every request, which the challenge explicitly says must stay correct "centenas ou milhares de peças" in — a good candidate for caching a per-company, short-lived result instead of recomputing it on every poll.

## Decision

- **Generic port, not a Part-specific one.** `domain/adapters/cache.adapter.ts` declares an abstract `CacheAdapter` with `get<T>(key)`, `set<T>(key, value, ttlSeconds?)`, `del(key)` — no knowledge of `PartEntity` or restock priorities at all. This mirrors the repository pattern (ADR 0004): an abstract port in `domain/`, a concrete adapter in `infra/`, swappable and mockable in unit tests. Any future feature that needs caching (sessions, rate limiting, another expensive read) reuses the same port instead of growing a parallel one.
- **Concrete implementation:** `infra/adapters/redis-cache.adapter.ts` (`RedisCacheAdapter`) implements it on top of the existing `RedisService`, JSON-(de)serializing whatever `T` it's given. It has no `PartEntity` import.
- **Entity-specific serialization stays on the entity.** `PartEntity.toJSON()` returns the clean `IPartEntity` shape (not the private `_name`/`_category`/... fields TypeScript actually stores), so `JSON.stringify(parts)` produces the same shape the rest of the app already uses. `PartEntity.fromPlain(data)` is the inverse, restoring `Date` instances for `createdAt`/`updatedAt`/`deletedAt`. Caching any other entity later means giving it the same two methods, not touching the adapter.
- **What's cached:** `GetRestockPrioritiesUseCase` reads/writes one cache entry per company, keyed `restock-priorities:{companyId}` (`PartPriorityService.cacheKeyFor`), holding the already filtered-and-sorted `PartEntity[]`. TTL defaults to 30s, overridable via `RESTOCK_PRIORITIES_CACHE_TTL_SECONDS`.
- **Invalidation:** `CreatePartUseCase`, `UpdatePartUseCase`, and `DeletePartUseCase` each call `cacheAdapter.del(...)` for the affected company right after the write succeeds, so a stale cache entry never outlives the TTL by more than the time it takes for the next read to happen — any part mutation invalidates instead of waiting out the TTL.
- Only this one endpoint is cached. `GET /parts` and everything else read straight from Postgres — caching every list would be scope creep with no evidence it's needed.

## Consequences

Repeated polling of `GET /restock/priorities` (the endpoint's realistic usage pattern — a dashboard, not a one-off call) hits Redis instead of recomputing over the full company inventory, at the cost of up to `TTL` seconds of staleness bounded by write-time invalidation. `CacheAdapter` is trivially mocked in the four usecases' unit tests (`get`/`set`/`del` as `jest.fn()`), same as `PartRepository`, so no test needs a real Redis connection. The Redis container declared in `docker-compose.yml` now has an actual caller.
