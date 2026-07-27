# Architecture Decision Records

Registro das decisões de arquitetura tomadas na implementação Node.js/NestJS do desafio Karhub, com o contexto e as consequências de cada uma.

| ADR | Decisão |
|---|---|
| [0001](0001-clean-architecture-layering.md) | Camadas de Clean Architecture (domain/application/infra/presentation) |
| [0002](0002-nestjs-as-http-framework.md) | NestJS como framework HTTP |
| [0003](0003-postgresql-and-prisma-orm.md) | PostgreSQL + Prisma, com driver adapter |
| [0004](0004-repository-pattern-for-swappable-persistence.md) | Repository pattern para persistência trocável |
| [0005](0005-multi-tenant-data-model.md) | Modelo multi-tenant (Company / User / Part) |
| [0006](0006-jwt-authentication-and-role-guards.md) | Autenticação JWT com guards de role, sem Passport |
| [0007](0007-isolate-restock-priority-calculation.md) | Cálculo de priorização isolado da camada HTTP |
| [0008](0008-password-hashing-with-bcryptjs.md) | Hash de senha com bcryptjs |
| [0009](0009-soft-deletes.md) | Soft delete via `deletedAt` |
| [0010](0010-testing-strategy.md) | Estratégia de testes: unitários com mocks + e2e real |
| [0011](0011-generic-cache-adapter-for-restock-priorities.md) | Adapter de cache genérico (Redis), usado para cachear `restock/priorities` |
