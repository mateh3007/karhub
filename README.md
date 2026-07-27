# Karhub — Desafio Backend: Motor de Priorização de Reposição de Estoque

Duas implementações do mesmo desafio técnico da Karhub (um distribuidor de autopeças decidindo automaticamente quais peças priorizar para reposição, dado estoque, ritmo de vendas, lead time do fornecedor e criticidade):

| Implementação | Stack | Status |
|---|---|---|
| [`node-js-test/`](node-js-test/README.md) | Node.js + TypeScript (NestJS, PostgreSQL, Redis) | ✅ Completo |
| [`golang-test/`](golang-test/) | Go | 🚧 Em andamento |
| [`frontend/`](frontend/README.md) | React + TypeScript + Tailwind CSS | ✅ Completo |

As duas implementações do backend expõem exatamente o mesmo contrato REST (mesmas rotas, mesmos payloads, mesmas regras de negócio) — a única diferença é a porta em que cada uma escuta. Veja o README de cada pasta para instruções de setup, endpoints e exemplos de requisição.

O [`frontend/`](frontend/README.md) consome esse contrato: login/cadastro, CRUD de peças e a tela de prioridades de reposição.

## Subir tudo com Docker

Um único `docker-compose.yml` na raiz sobe o stack inteiro: Postgres, Redis, o backend Node (aplica as migrations automaticamente antes de subir) e o frontend.

```bash
docker compose up -d --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:3000 (Swagger em `/docs`)

O backend em Go ainda não existe (`golang-test/` está vazio), então o serviço `golang-backend` fica atrás de um profile e **não** sobe com o comando acima — só com `docker compose --profile golang up`, e mesmo assim só vai funcionar quando houver código Go de verdade em `golang-test/`.

> Se você também usa `node-js-test/docker-compose.yml` (só Postgres+Redis, para rodar o backend com `npm run start:dev` fora de container), não suba os dois ao mesmo tempo — competem pelas mesmas portas (5432/6379).
