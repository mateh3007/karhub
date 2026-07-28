# Architecture Decision Records

Registro das decisões de arquitetura específicas da implementação em Go do desafio Karhub. As decisões de negócio/domínio (multi-tenancy, priorização de reposição, soft delete, paginação, cache, rate limiting) são as mesmas do `node-js-test` e não são repetidas aqui — só o que muda por ser Go estão documentadas nesta pasta.

| ADR | Decisão |
|---|---|
| [0001](0001-gin-as-http-framework.md) | Gin como framework HTTP |
| [0002](0002-pgx-manual-sql-no-orm.md) | pgx com SQL manual, sem ORM |
| [0003](0003-independent-database-and-migrations.md) | Banco de dados e migrations independentes (`karhub_go`) |
| [0004](0004-custom-per-ip-rate-limiter.md) | Rate limiter próprio por IP (`x/time/rate`) |
