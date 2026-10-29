# AGENTS.md — Colina Lanches

## Contexto

Cardápio e montagem de pedido de uma lanchonete. Não há backend: a sacola vive no `localStorage` e o envio real (WhatsApp) está desativado nesta demonstração. PWA com service worker.

## Stack

React 19, TypeScript estrito, Vite 7 (`vite-plugin-singlefile`), Tailwind 4, Framer Motion, Lucide, Vitest.

## Comandos

```bash
npm ci
npm run dev
npm run typecheck
npm test
npm run build
npm run preview
```

Sempre valide typecheck, testes e build antes de concluir.

## Arquitetura

| Caminho | Responsabilidade |
| --- | --- |
| `src/App.tsx` | Página, categorias, busca, sacola, modais e PWA |
| `src/utils/cart.ts` | Regras puras: adicionais, subtotal, assinatura de linha, mensagem |
| `src/components/OrderModal.tsx` | Checkout e validação |
| `src/components/DemoNotice.tsx` | Bloqueio de contatos fictícios |
| `src/data/menu.json` | Fonte única do cardápio e da loja |
| `public/sw.js` | Cache offline (versão do cache deve ser bumpada em mudanças) |
| `public/manifest.webmanifest` | Metadados PWA |

## Regras

1. Nunca inserir contato real de cliente neste repositório público.
2. O checkout não pode abrir `window.open` para WhatsApp nesta versão; dispare `demo:contact`.
3. Preços são exemplos: mantenha o aviso de confirmação na loja.
4. Ao mudar o cardápio, preserve os `id` usados pela sacola ou versione a chave `CART_KEY`.
5. Ao alterar assets do PWA, incremente `VERSION` em `public/sw.js` e teste a instalação.
6. Novas regras de carrinho precisam de teste em `src/utils/cart.test.ts`.

## Estilo

- Paleta: marrom `#482017`, vermelho `#7d281d`, amarelo `#f4bc35`, creme `#f6f1e8`.
- Tipografia condensada nos títulos; mantenha o tom direto e popular.
- Não adicione bibliotecas de UI: o layout é CSS próprio + Tailwind pontual.
- Acessibilidade: foco visível, `aria-label` nos botões de ícone, modais com Escape e foco controlado.

## Git e deploy

Gitflow + Gitmoji (`main` com tags, `develop`, `feature/*`). Vercel: framework Vite, output `dist`, sem env vars.
