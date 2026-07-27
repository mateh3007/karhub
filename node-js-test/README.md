# Karhub Backend Test — Node.js + NestJS

Implementação em Node.js/TypeScript do desafio técnico de backend da Karhub: um motor de priorização de reposição de estoque para um distribuidor de autopeças.

## O desafio

O sistema precisa gerenciar o cadastro de peças e, principalmente, decidir automaticamente **quais peças priorizar para reposição**, considerando estoque atual, estoque mínimo desejado, ritmo de vendas, tempo de entrega do fornecedor e nível de criticidade de cada peça. O resultado é exposto por um endpoint que retorna as peças ordenadas por urgência de reposição, com o cálculo isolado da camada HTTP e testado à parte.

Além do CRUD de peças em si, esta implementação modela autenticação e multi-tenancy — cada empresa distribuidora gerencia seu próprio catálogo de peças e usuários, sem visibilidade sobre o estoque, usuários ou dados de outras empresas. Essa é uma extensão do escopo original do desafio (que descreve um único distribuidor), documentada em [`docs/adr/0005-multi-tenant-data-model.md`](docs/adr/0005-multi-tenant-data-model.md).

## Stack

- **NestJS** (TypeScript) — [ADR 0002](docs/adr/0002-nestjs-as-http-framework.md)
- **PostgreSQL + Prisma** — [ADR 0003](docs/adr/0003-postgresql-and-prisma-orm.md), com índices para listagem paginada por tenant — [ADR 0014](docs/adr/0014-database-indexes-for-tenant-scoped-listing.md)
- **JWT + guards de role** para autenticação/autorização — [ADR 0006](docs/adr/0006-jwt-authentication-and-role-guards.md)
- **Redis**, via um `CacheAdapter` genérico, para cachear `GET /restock/priorities` por empresa — [ADR 0011](docs/adr/0011-generic-cache-adapter-for-restock-priorities.md)
- **Paginação** em `/parts`, `/users` e `/restock/priorities` — [ADR 0012](docs/adr/0012-pagination-for-list-endpoints.md)
- **Jest** para testes unitários e e2e — [ADR 0010](docs/adr/0010-testing-strategy.md)
- **CI/CD via GitHub Actions**, com deploy propositalmente não conectado a nada — [ADR 0013](docs/adr/0013-cicd-pipeline.md)
- **Rate limiting** (`@nestjs/throttler`), mais restritivo em `/auth/*` — [ADR 0015](docs/adr/0015-rate-limiting-with-nestjs-throttler.md)

## Arquitetura

O código é organizado em camadas (Clean Architecture), com as regras de negócio isoladas de HTTP e de banco de dados — o racional completo está no [ADR 0001](docs/adr/0001-clean-architecture-layering.md):

```
src/
├── domain/          # entidades, regras de negócio puras, interfaces de repositório e de cache
├── application/     # usecases (orquestração) e services de domínio (cálculo de prioridade)
├── infra/           # Prisma, Redis, guards, decorators — tudo que depende de framework/banco
└── presentation/    # controllers e DTOs (camada HTTP)
```

Todas as decisões de arquitetura relevantes — e o porquê de cada uma — estão documentadas em [`docs/adr/`](docs/adr/).

## Como rodar localmente

Pré-requisitos: Node 20+, Docker (para Postgres e Redis).

```bash
cd node-js-test
cp .env.example .env          # valores padrão já funcionam com o docker-compose abaixo
docker compose up -d          # sobe Postgres (5432) e Redis (6379)
npm install
npx prisma migrate deploy     # aplica as migrations
npm run start:dev             # API em http://localhost:3000
```

Documentação interativa (Swagger) em `http://localhost:3000/docs`.

```bash
npm test          # testes unitários (Jest, sem banco/Redis reais)
npm run test:e2e  # e2e (sobe o AppModule real contra o Postgres do docker-compose)
```

## Endpoints principais

Todos os endpoints (exceto `/auth/*`) exigem `Authorization: Bearer <accessToken>`. `companyId` nunca é aceito no corpo da requisição — é sempre derivado do token de quem está autenticado, garantindo o isolamento entre empresas (ADR 0005).

Todos os endpoints têm rate limit de 100 requisições/60s por IP; `/auth/register` e `/auth/login` são mais restritos (20/60s) contra brute-force — excedeu, `429 Too Many Requests` com header `Retry-After` (ADR 0015).

| Método | Rota                   | Papel   | Descrição |
|--------|------------------------|---------|-----------|
| POST   | `/auth/register`       | público | Cria uma empresa e seu usuário ADMIN |
| POST   | `/auth/login`          | público | Autentica e retorna um `accessToken` (JWT) |
| GET    | `/companies`           | ADMIN/USER | Retorna a própria empresa |
| GET    | `/companies/:id`       | ADMIN/USER | Detalhe da empresa (404 se não for a sua) |
| PUT    | `/companies/:id`       | ADMIN   | Atualiza a própria empresa |
| DELETE | `/companies/:id`       | ADMIN   | Remove (soft delete) a própria empresa |
| POST   | `/users`               | ADMIN   | Cria um usuário na própria empresa |
| GET    | `/users?page=&limit=`  | ADMIN/USER | Lista paginada dos usuários da própria empresa |
| GET    | `/users/:id`           | ADMIN/USER | Detalhe de um usuário da própria empresa |
| PUT    | `/users/:id`           | ADMIN   | Atualiza um usuário da própria empresa |
| DELETE | `/users/:id`           | ADMIN   | Remove um usuário da própria empresa |
| POST   | `/parts`               | ADMIN   | Cria uma peça |
| GET    | `/parts?category=&page=&limit=` | ADMIN/USER | Lista paginada de peças da própria empresa (filtro opcional por categoria) |
| GET    | `/parts/:id`           | ADMIN/USER | Detalhe de uma peça |
| PUT    | `/parts/:id`           | ADMIN   | Atualiza uma peça |
| DELETE | `/parts/:id`           | ADMIN   | Remove (soft delete) uma peça |
| **GET**| **`/restock/priorities?page=&limit=`** | ADMIN/USER | **Peças que precisam de reposição, ordenadas por urgência, paginado** |

`page` (padrão `1`, mínimo `1`) e `limit` (padrão `20`, máximo `100`) são opcionais nos três endpoints paginados; valores fora do intervalo retornam `400`. Cada resposta paginada traz `total`/`page`/`limit`/`totalPages` junto com os dados (`data` em `/parts` e `/users`, `priorities` em `/restock/priorities`, mantendo o nome do campo do enunciado do desafio) — o racional de por que `/restock/priorities` pagina em memória sobre a lista já ordenada, e `/parts`/`/users` paginam no banco, está na [ADR 0012](docs/adr/0012-pagination-for-list-endpoints.md).

> A porta padrão é `3000` (`PORT` no `.env`). A versão em Golang do mesmo desafio expõe exatamente os mesmos endpoints, em outra porta.

## Exemplos de requisição

```bash
# 1. Registrar uma empresa + usuário ADMIN
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "corporateName": "Auto Pecas LTDA",
    "tradeName": "Auto Pecas",
    "cnpj": "12345678000199",
    "phone": "11999999999",
    "contactEmail": "admin@autopecas.com",
    "adminName": "Admin Root",
    "adminPassword": "strongPassword123"
  }'

# 2. Login
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@autopecas.com", "password": "strongPassword123"}'
# => {"accessToken": "eyJhbGciOi..."}

TOKEN="eyJhbGciOi..."

# 3. Criar uma peça (exemplo do próprio enunciado do desafio)
curl -X POST http://localhost:3000/parts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Filtro de Oleo X",
    "category": "engine",
    "currentStock": 15,
    "minimumStock": 20,
    "averageDailySales": 4,
    "leadTimeDays": 5,
    "unitCost": 18.50,
    "criticalityLevel": 3
  }'

# 4. Ver as prioridades de reposição (paginado)
curl "http://localhost:3000/restock/priorities?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
# => {"priorities": [{"partId": "...", "name": "Filtro de Oleo X", "currentStock": 15,
#      "projectedStock": -5, "minimumStock": 20, "urgencyScore": 75}],
#     "total": 1, "page": 1, "limit": 20, "totalPages": 1}
```

## Testes

- **Unitários** (`npm test`): regras de negócio de `PartEntity`/`PartPriorityService` com casos extremos (estoque negativo, venda zero, lead time alto, empates nos 3 níveis de desempate), todos os usecases com repositórios mockados, e o adapter de cache Redis isolado — sem banco ou HTTP reais.
- **E2E** (`npm run test:e2e`): sobe a aplicação real contra o Postgres do `docker-compose`, cobrindo o fluxo completo (registro → login → criar peça → ver em `/restock/priorities`), autorização por papel, isolamento entre empresas (uma empresa não lê, edita ou deleta dados de outra) e paginação.

## CI/CD

Dois workflows do GitHub Actions em [`.github/workflows/`](../.github/workflows/), escopados a mudanças em `node-js-test/`:

- **`node-ci.yml`** — em todo push/PR: sobe Postgres e Redis reais (containers de serviço), instala, faz lint, gera o client do Prisma, builda, roda os testes unitários, aplica as migrations e roda os testes e2e. Nenhuma etapa é simulada.
- **`node-deploy.yml`** — em todo push para `main`: builda a imagem Docker ([`Dockerfile`](Dockerfile), multi-stage) e publica em `ghcr.io` (funciona de verdade, sem precisar de nenhuma conta externa — usa o `GITHUB_TOKEN` do próprio repositório). A etapa seguinte, que rodaria migrations em produção e disparia um redeploy, existe mas fica inerte enquanto os secrets `PROD_DATABASE_URL`/`DEPLOY_HOOK_URL` não forem configurados neste repositório — propositalmente, já que não há nenhum ambiente real para apontar.

Racional completo, incluindo por que o deploy fica desconectado de propósito, na [ADR 0013](docs/adr/0013-cicd-pipeline.md).

Mais contexto e o porquê de cada decisão em [`docs/adr/`](docs/adr/).
