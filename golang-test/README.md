# Karhub Backend Test — Go

Implementação em Go do desafio técnico de backend da Karhub: um motor de priorização de reposição de estoque para um distribuidor de autopeças. Mesmo contrato REST, mesmas regras de negócio e mesma disciplina de camadas do [`node-js-test/`](../node-js-test/README.md) — um port direto, não uma reinterpretação do desafio.

## O desafio

O sistema precisa gerenciar o cadastro de peças e, principalmente, decidir automaticamente **quais peças priorizar para reposição**, considerando estoque atual, estoque mínimo desejado, ritmo de vendas, tempo de entrega do fornecedor e nível de criticidade de cada peça. O resultado é exposto por um endpoint que retorna as peças ordenadas por urgência de reposição, com o cálculo isolado da camada HTTP e testado à parte.

Como no `node-js-test`, esta implementação também modela autenticação e multi-tenancy: cada empresa distribuidora gerencia seu próprio catálogo de peças e usuários, sem visibilidade sobre os dados de outras empresas.

## Stack

- **Gin** — framework HTTP ([ADR 0001](docs/adr/0001-gin-as-http-framework.md))
- **PostgreSQL + pgx**, repositórios com SQL manual (sem ORM) ([ADR 0002](docs/adr/0002-pgx-manual-sql-no-orm.md)), banco e migrations (`golang-migrate`) independentes do `node-js-test` ([ADR 0003](docs/adr/0003-independent-database-and-migrations.md))
- **Redis**, via a mesma ideia de `CacheAdapter` genérico do Node, para cachear `GET /restock/priorities` por empresa
- **JWT** (`golang-jwt/jwt/v5`) + middleware de role, mesmo payload (`sub`, `email`, `role`, `companyId`) do Node
- **bcrypt** (`golang.org/x/crypto/bcrypt`), custo 10 — igual ao Node
- **Rate limiting** próprio por IP (`golang.org/x/time/rate`), mesmos limites do Node (100/60s global, 20/60s em `/auth/*`) ([ADR 0004](docs/adr/0004-custom-per-ip-rate-limiter.md))
- **`testing` + testify**, com fakes escritos à mão para os repositórios — mesmo espírito dos mocks manuais do Jest

## Arquitetura

Mesma Clean Architecture do `node-js-test` (camadas de negócio isoladas de HTTP e banco), com a mesma direção de dependência: `domain` não importa nada de `infra`/`presentation`, `application` só depende de `domain`, `infra` implementa as interfaces de `domain`, `presentation` depende de `application`.

```
internal/
├── domain/          # entities, regras de negócio puras, interfaces de repository e de cache
├── application/     # usecases (orquestração) e services (cálculo de prioridade)
├── infra/           # postgres, redis, jwt, config — tudo que depende de driver/framework
└── presentation/    # router, handlers, DTOs, middleware (camada HTTP)
```

Decisões específicas de ter portado o desafio para Go (por que Gin, por que sem ORM, por que um banco próprio, por que um rate limiter escrito à mão) estão em [`docs/adr/`](docs/adr/README.md).

## Como rodar localmente

Pré-requisitos: Go 1.25+, Docker (para Postgres e Redis) — o mesmo Postgres/Redis do `docker-compose.yml` na raiz do repositório.

```bash
cd golang-test
cp .env.example .env      # valores padrão já funcionam com o docker-compose da raiz
docker compose -f ../docker-compose.yml up -d postgres redis
go run ./cmd/migrate       # aplica as migrations contra o banco karhub_go
go run ./cmd/api           # API em http://localhost:8080
```

```bash
go test ./...              # unitários (domain, application) + e2e (real, contra Postgres/Redis)
```

Os testes de `test/e2e` sobem o roteador real (`presentation.NewRouter`) num `httptest.Server` contra o Postgres/Redis reais; se não conseguirem conectar, são pulados (`t.Skip`) em vez de falhar.

## Endpoints principais

Idênticos ao `node-js-test` — mesmas rotas, mesmos payloads, mesmas regras de negócio, só a porta muda. Todos os endpoints (exceto `/auth/*`) exigem `Authorization: Bearer <accessToken>`; `companyId` nunca é aceito no corpo da requisição, sempre derivado do token.

Rate limit de 100 requisições/60s por IP em todas as rotas; `/auth/register` e `/auth/login` são mais restritos (20/60s).

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

> A porta padrão é `8080` (`PORT` no `.env`). O `node-js-test` expõe exatamente os mesmos endpoints na porta `3000`.

## Exemplos de requisição

```bash
# 1. Registrar uma empresa + usuário ADMIN
curl -X POST http://localhost:8080/auth/register \
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
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@autopecas.com", "password": "strongPassword123"}'
# => {"accessToken": "eyJhbGciOi..."}

TOKEN="eyJhbGciOi..."

# 3. Criar uma peça (exemplo do próprio enunciado do desafio)
curl -X POST http://localhost:8080/parts \
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
curl "http://localhost:8080/restock/priorities?page=1&limit=20" \
  -H "Authorization: Bearer $TOKEN"
# => {"priorities": [{"partId": "...", "name": "Filtro de Oleo X", "currentStock": 15,
#      "projectedStock": -5, "minimumStock": 20, "urgencyScore": 75}],
#     "total": 1, "page": 1, "limit": 20, "totalPages": 1}
```

Byte a byte igual à resposta do `node-js-test` para o mesmo input.

## Testes

- **Domain/application** (`go test ./internal/domain/... ./internal/application/...`): regras de negócio de `Part`/`PartPriorityService` com os mesmos casos extremos do Node (estoque negativo, venda zero, lead time alto, os 4 níveis de desempate), e usecases representativos (`create`/`get`/`update`/`delete` de Part, `register`/`login`, `company`/`user`) com fakes de repository escritos à mão, cobrindo tenant-scoping e os casos de erro (duplicidade, 404 cross-tenant, "Invalid credentials" sem enumeração de usuário).
- **E2E** (`go test ./test/e2e/...`): sobe o roteador real com Postgres/Redis reais via `httptest.Server`, cobrindo o fluxo completo (registro → login → criar peça → ver em `/restock/priorities` com os números certos do enunciado), isolamento entre empresas (uma empresa não lê dados de outra — 404, não 403), autorização por papel (USER bloqueado de rotas ADMIN-only, com controle positivo pro ADMIN) e rate limit (`429` após estourar o limite de `/auth/login`).
