# Segurança Moneyoung

## Politicas

- Nunca commitar `.env` ou chaves reais.
- Nunca expor `SUPABASE_SERVICE_ROLE_KEY` no mobile ou no web admin.
- Nunca alterar `wallets.balance` pelo frontend.
- Nunca inserir ou deletar transacoes pelo frontend.
- Nunca deletar `transactions`, `audit_logs` ou `security_events`.
- Correcoes financeiras devem ser feitas por estorno.

## Falhas

1. Bloqueie wallet afetada via `block_wallet`.
2. Preserve transacoes e audit logs.
3. Registre um `security_event` se a falha envolver tentativa invalida ou abuso.
4. Estorne somente transacoes `completed` quando aplicavel.
5. Rotacione chaves se houver suspeita de vazamento.

## Rotacao de chaves

- Revogue chaves no painel Supabase.
- Atualize variaveis nas Edge Functions, Vercel e EAS.
- Refaça deploy das funcoes e apps.
- Revise audit logs apos a rotacao.

## Revisao

Antes de piloto real, revisar RLS, limites, logs, OAuth redirects, backups e acesso de administradores.
