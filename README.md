# Karhub — Desafio Backend: Motor de Priorização de Reposição de Estoque

Duas implementações do mesmo desafio técnico da Karhub (um distribuidor de autopeças decidindo automaticamente quais peças priorizar para reposição, dado estoque, ritmo de vendas, lead time do fornecedor e criticidade):

| Implementação | Stack | Status |
|---|---|---|
| [`node-js-test/`](node-js-test/README.md) | Node.js + TypeScript (NestJS, PostgreSQL, Redis) | ✅ Completo |
| [`golang-test/`](golang-test/) | Go | 🚧 Em andamento |

As duas expõem exatamente o mesmo contrato REST (mesmas rotas, mesmos payloads, mesmas regras de negócio) — a única diferença é a porta em que cada uma escuta. Veja o README de cada pasta para instruções de setup, endpoints e exemplos de requisição.
