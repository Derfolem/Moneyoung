# Web Admin

## Estrutura

`apps/web-admin` usa Next.js App Router, TypeScript, Supabase client, layout administrativo e tabelas reutilizaveis.

## Rotas

`/login`, `/dashboard`, `/accounts`, `/wallets`, `/transactions`, `/transactions/[id]`, `/organizations`, `/audit`, `/security-events`, `/limits`, `/settings`.

## Permissoes

O shell valida sessao e role `bank_admin` ou `super_admin`. Acoes sensiveis usam Edge Functions.

## Rodar local

```bash
cd ycbank
npm run dev:web
```

## Vercel

Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Nao configure service role no frontend.
