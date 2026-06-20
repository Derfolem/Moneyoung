# Banco de dados

Migrations em `supabase/migrations/`:
- `202606160001_youngcoin_core.sql` — schema base, RLS, RPCs
- `202606170001_youngcoin_backend_hardening.sql` — rate limiting, locking, idempotencia aprimorada
- `202606190001_user_types_and_enriched_transactions.sql` — tipos de usuario, chaves com prefixo, view enriquecida

## Tabelas

- `profiles`: identidade Moneyoung, email, young_key com prefixo, role, tipo e status.
- `organizations`: escolas/organizacoes.
- `organization_members`: vinculos entre contas e organizacoes (student, teacher, staff, admin).
- `wallets`: saldo cacheado e status operacional.
- `transactions`: ledger financeiro auditavel.
- `audit_logs`: registro de acoes sensiveis.
- `transfer_limits`: limites por tipo de conta (personal, business, sub_business, system).
- `security_events`: eventos relevantes de seguranca.

## Tipos de Conta (account_type)

| Tipo | Prefixo young_key | Descricao |
|---|---|---|
| `personal` | `@ALN-` | Alunos |
| `business` | `@EMP-` | Empresas (colegios, escolas) |
| `sub_business` | `@SUBEMP-` | Sub-empresas (professores, tutores) |
| `system` | `@ADM-` | Administradores do banco |

## Limites por tipo de conta

| account_type | transaction_limit | daily_limit | minute_limit |
|---|---|---|---|
| personal | 250 | 1.000 | 10 |
| sub_business | 1.000 | 5.000 | 30 |
| business | 2.500 | 10.000 | 60 |
| system | ilimitado | ilimitado | ilimitado |

## View enriched_transactions

View que junta transacoes com perfis dos participantes:

| Coluna extra | Descricao |
|---|---|
| from_display_name | Nome de quem enviou |
| from_young_key | Chave de quem enviou |
| from_account_type | Tipo da conta de origem |
| from_role | Role de quem enviou |
| to_display_name | Nome de quem recebeu |
| to_young_key | Chave de quem recebeu |
| to_account_type | Tipo da conta de destino |
| to_role | Role de quem recebeu |

Herda RLS da tabela `transactions`. Usada pelo Edge Function `get_wallet_summary`.

## Ledger e saldo

O ledger e a fonte da verdade. `wallets.balance` existe para performance e e atualizado somente por RPCs transacionais. O saldo pode ser recalculado somando entradas e saidas do ledger.

### Alerta de escalabilidade

A partir de 1.000 acessos simultaneos, consultas frequentes ao ledger podem impactar performance. Acoes recomendadas:
- Manter `wallets.balance` sempre atualizado pelas RPCs.
- Paginar consultas de extrato.
- A partir de 10.000 acessos, considerar read replicas.

## Transacoes

Transacoes nunca sao deletadas. Cada movimentacao tem `idempotency_key`, origem, destino, valor, tipo, status e criador.

## Estorno

Estorno cria nova transacao `type = reversal`, inverte origem/destino, atualiza a original para `reversed` e registra audit log.

## Funcoes (RPCs)

| Funcao | Descricao |
|---|---|
| `generate_young_key(base_text, account_type)` | Gera chave com prefixo por tipo (@ALN-, @EMP-, @SUBEMP-, @ADM-) |
| `create_profile_and_wallet(user_id, email, name, avatar, account_type, role)` | Cria perfil + wallet com tipo especifico |
| `transfer_youngcoin_tx(...)` | Transferencia segura com todas as validacoes |
| `reverse_transaction_tx(...)` | Estorno (apenas bank_admin) |
| `block_wallet_tx(...)` | Bloquear/desbloquear wallet (apenas bank_admin) |
| `create_organization_account_tx(...)` | Criar organizacao + wallet empresa |
| `is_bank_admin(profile_id)` | Verifica se e admin do banco |
| `current_profile()` | Retorna perfil do usuario autenticado |
| `account_type_label(account_type)` | Retorna label em pt-BR (Aluno, Empresa, Professor, Administrador) |

## RLS (Row Level Security)

Todas as tabelas tem RLS ativado:
- **profiles**: le proprio ou bank_admin
- **wallets**: le proprio ou bank_admin
- **transactions**: le se participou ou bank_admin
- **enriched_transactions**: herda RLS de transactions (grant select to authenticated)
- **organizations**: le se membro ou bank_admin
- **audit_logs**: apenas bank_admin
- **security_events**: apenas bank_admin
- **transfer_limits**: qualquer autenticado pode ler

## Protecoes Extras

- `INSERT/UPDATE/DELETE` em transactions revogado para anon/authenticated
- `UPDATE(balance)` em wallets revogado para anon/authenticated
- `DELETE` em audit_logs e security_events revogado
