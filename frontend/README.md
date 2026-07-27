# KarHub — Frontend

Frontend minimalista para o [backend Node.js/NestJS](../node-js-test) do desafio Karhub, com React + TypeScript + Tailwind CSS.

## Stack

- **React 19 + TypeScript**, via **Vite**
- **Tailwind CSS v4** (`@tailwindcss/vite`), com a paleta de cores da marca (`karhub-orange` `#f25a29`, `karhub-navy` `#1b3059`)
- **React Router** para navegação
- Sem bibliotecas de UI/estado externas — components próprios minimalistas (`src/components/ui/`)

## Como rodar localmente

Pré-requisito: o backend rodando (veja [`../node-js-test/README.md`](../node-js-test/README.md)), com CORS liberado para `http://localhost:5173` (já é o padrão).

```bash
cd frontend
cp .env.example .env   # VITE_API_URL, padrão já aponta pro backend local
npm install
npm run dev            # http://localhost:5173
```

## Funcionalidades

- **Login / Cadastro** (`/login`, `/register`) — cadastro cria a empresa + usuário ADMIN, autentica automaticamente ao final.
- **Prioridades de reposição** (`/`) — a tela inicial após login: lista paginada das peças que precisam de reposição, já ordenadas por urgência pelo backend.
- **Peças** (`/parts`) — listagem paginada com filtro por categoria; criar/editar/excluir são restritos a usuários ADMIN (a UI esconde os botões para USER, e o backend também rejeita com 403 independentemente).

O token JWT fica em `localStorage`; papel e email exibidos no cabeçalho vêm do próprio payload do token (decodificado no cliente, nunca usado para decisões de autorização — isso continua 100% no backend).

## Estrutura

```
src/
├── api/            # client fetch + chamadas por recurso (auth, parts, restock)
├── auth/            # AuthContext, decodificação de JWT, storage do token
├── components/      # Layout, guards de rota, modais, UI primitives
├── pages/           # uma por rota
└── types/           # tipos espelhando os DTOs do backend
```
