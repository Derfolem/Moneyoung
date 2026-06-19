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
- PostgreSQL: RLS, ledger, wallets, limites e eventos de seguranca.

## Tecnologias

Expo acelera builds Android/iOS com EAS. Next.js entrega painel admin. Supabase concentra Auth, banco, RLS e Edge Functions. PostgreSQL permite transacoes atomicas e auditoria forte.

## Fluxo de dados

Frontends autenticam, chamam Edge Functions com JWT, a funcao usa service role em ambiente seguro, executa RPC transacional e retorna resultado minimo ao cliente.
