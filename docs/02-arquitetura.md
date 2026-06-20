# Arquitetura

```text
Mobile Expo -> Supabase Auth -> Edge Functions -> PostgreSQL
Web Admin  -> Supabase Auth -> Edge Functions -> PostgreSQL
Frontend   -> RLS para leitura permitida
Service role -> somente Edge Functions
```

## Camadas

- Mobile: experiencia da carteira Moneyoung, sem logica financeira critica.
- Web Admin: operacao do Moneyoungbank, sem escrita direta de saldo.
- Edge Functions: validacao, autorizacao, transacoes e audit logs.
- PostgreSQL: RLS, ledger, wallets, limites, views enriquecidas e eventos de seguranca.

## Tecnologias

Expo acelera builds Android/iOS com EAS. Next.js entrega painel admin. Supabase concentra Auth, banco, RLS e Edge Functions. PostgreSQL permite transacoes atomicas e auditoria forte.

## Fluxo de dados

Frontends autenticam, chamam Edge Functions com JWT, a funcao usa service role em ambiente seguro, executa RPC transacional e retorna resultado minimo ao cliente.

## View enriched_transactions

View SQL que junta `transactions` com `wallets` e `profiles` para retornar nomes, chaves e tipos de conta dos participantes em cada transacao. Usada pelo Edge Function `get_wallet_summary` para alimentar extrato, notificacoes e auditoria no frontend.

## Sistema de feedback (Toast)

O frontend mobile usa um sistema de Toast global (`src/services/toast.ts` + `src/components/Toast.tsx`) que substitui `Alert.alert` do React Native. Funciona tanto na web quanto no nativo, com animacao e suporte a sucesso/erro/info. Montado no `_layout.tsx` raiz.

## Traducao de erros

Erros retornados pelo backend em codigos (`INSUFFICIENT_FUNDS`, `DESTINATION_NOT_FOUND`, etc.) sao traduzidos para portugues no frontend pela funcao `translateError()` em `moneyoung.ts`.
