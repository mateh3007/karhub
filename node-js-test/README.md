# Karhub Backend Test — Node.js + NestJS

Implementação em Node.js/TypeScript do desafio técnico de backend da Karhub: um motor de priorização de reposição de estoque para um distribuidor de autopeças.

## O desafio

O sistema precisa gerenciar o cadastro de peças e, principalmente, decidir automaticamente **quais peças priorizar para reposição**, considerando estoque atual, estoque mínimo desejado, ritmo de vendas, tempo de entrega do fornecedor e nível de criticidade de cada peça. O resultado é exposto por um endpoint que retorna as peças ordenadas por urgência de reposição, com o cálculo isolado da camada HTTP e testado à parte.

Além do CRUD de peças em si, esta implementação modela autenticação e multi-tenancy — cada empresa distribuidora gerencia seu próprio catálogo de peças e usuários, sem visibilidade sobre o estoque de outras empresas. Essa é uma extensão do escopo original do desafio (que descreve um único distribuidor), documentada em [`docs/adr/0005-multi-tenant-data-model.md`](docs/adr/0005-multi-tenant-data-model.md).

## Stack

- **NestJS** (TypeScript) — [ADR 0002](docs/adr/0002-nestjs-as-http-framework.md)
- **PostgreSQL + Prisma** — [ADR 0003](docs/adr/0003-postgresql-and-prisma-orm.md)
- **JWT + guards de role** para autenticação/autorização — [ADR 0006](docs/adr/0006-jwt-authentication-and-role-guards.md)
- **Redis**, via um `CacheAdapter` genérico, para cachear `GET /restock/priorities` por empresa — [ADR 0011](docs/adr/0011-generic-cache-adapter-for-restock-priorities.md)
- **Jest** para testes unitários e e2e — [ADR 0010](docs/adr/0010-testing-strategy.md)

## Arquitetura

O código é organizado em camadas (Clean Architecture), com as regras de negócio isoladas de HTTP e de banco de dados — o racional completo está no [ADR 0001](docs/adr/0001-clean-architecture-layering.md):

```
src/
├── domain/          # entidades, regras de negócio puras, interfaces de repositório
├── application/     # usecases (orquestração) e services de domínio
├── infra/           # Prisma, guards, decorators — tudo que depende de framework/banco
└── presentation/    # controllers e DTOs (camada HTTP)
```

Todas as decisões de arquitetura relevantes — e o porquê de cada uma — estão documentadas em [`docs/adr/`](docs/adr/).
