# Banco de dados

As tabelas obrigatorias estao em `supabase/migrations/202606160001_youngcoin_core.sql`.

## Tabelas

- `profiles`: identidade Moneyoung, email, young_key, role, tipo e status.
- `organizations`: escolas/organizacoes.
- `organization_members`: vinculos entre contas e organizacoes.
- `wallets`: saldo cacheado e status operacional.
- `transactions`: ledger financeiro auditavel.
- `audit_logs`: registro de acoes sensiveis.
- `transfer_limits`: limites por tipo de conta.
- `security_events`: eventos relevantes de seguranca.

## Ledger e saldo

O ledger e a fonte da verdade. `wallets.balance` existe para performance e e atualizado somente por RPCs transacionais. O saldo pode ser recalculado somando entradas e saidas do ledger.

### Alerta de escalabilidade

A partir de 1.000 acessos simultaneos, consultas frequentes ao ledger (extrato completo, recalculo de saldo) podem impactar a performance do banco. Acoes recomendadas:

- Manter `wallets.balance` sempre atualizado pelas RPCs para evitar recalculos em tempo real.
- Paginar consultas de extrato (nunca retornar historico completo de uma vez).
- A partir de 10.000 acessos, considerar read replicas para consultas de leitura (extrato, auditoria, dashboard) separando a carga de escrita (transferencias, estornos).

## Transacoes

Transacoes nunca sao deletadas. Cada movimentacao tem `idempotency_key`, origem, destino, valor, tipo, status e criador.

## Estorno

Estorno cria nova transacao `type = reversal`, inverte origem/destino, atualiza a original para `reversed` e registra audit log.
