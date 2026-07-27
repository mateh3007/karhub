# ADR 0005: Multi-tenant data model (Company / User / Part)

**Status:** Accepted

## Context

The original challenge describes a single distributor with a flat list of parts. This project instead models a small SaaS-style system serving multiple distributors, so a part needs an owner, and every endpoint — not just the ones for parts — needs to keep one distributor from seeing, editing, or deleting another distributor's data.

## Decision

- Every `User` belongs to exactly one `Company` (`companyId`), assigned at creation and never sent by the client on create/update — `CreateUserDto` takes it from `request.user.companyId`, same as parts.
- Every `Part` also belongs to exactly one `Company` (`companyId`), for the same reason.
- `Company` is the tenant root, so it has no `companyId` field of its own; instead, an ADMIN may only read, update, or delete **their own** company. `GET /companies` returns a one-element array (the caller's own company) rather than every company in the system.
- Every usecase for `User` and `Part` receives `companyId` from the authenticated user's JWT payload (injected by the controller from `request.user.companyId`), never from the request body.
- Repository lookups used by usecases are always tenant-scoped: `findByCompanyId(companyId, ...)` for lists, `findByIdAndCompanyId(id, companyId)` for single-record lookups used by get/update/delete. `UserRepository` and `PartRepository` both expose this pair of methods with identical semantics. `CompanyRepository` doesn't need an equivalent — the ownership check is a plain `company.id === callerCompanyId` comparison after `findById`, since a company can't have a foreign key to itself.
- A record that exists but belongs to a different company is treated as **not found (404)**, not **forbidden (403)** — this avoids confirming to an unauthorized tenant that a given id exists at all. This applies uniformly to companies, users, and parts.

## Consequences

Two different companies can never read, list, update, or delete each other's companies, users, or inventory — covered by explicit cross-tenant tests at both the usecase level (company B gets `404` looking up company A's user, company A gets an empty list from `GET /parts` scoped to company B) and end-to-end (`test/app.e2e-spec.ts`: a second company's ADMIN gets `404` on the first company's company record and user record, and neither appears in their own `GET /companies`/`GET /users` listings).

The cost, relative to the single-tenant model the raw challenge describes, is a `companyId` argument threaded through every company/user/part usecase and repository method, and one extra abstract repository method (`findByIdAndCompanyId`) per scoped aggregate.
