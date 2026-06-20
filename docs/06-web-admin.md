# Web Admin — Moneyoungbank

Data: 2026-06-16 (atualizado 2026-06-19)

## Estrutura

`apps/web-admin` usa Next.js 14 App Router, TypeScript, Supabase client, layout administrativo com sidebar teal/dark e tabelas reutilizaveis.

## Componentes

| Componente | Arquivo | Descricao |
|---|---|---|
| AdminShell | `src/components/AdminShell.tsx` | Layout com sidebar, validacao de sessao admin, navegacao |
| DataTable | `src/components/DataTable.tsx` | Tabela generica com colunas, loading, erro, empty state |
| StatusPill | `src/components/DataTable.tsx` | Badge colorido por status (active, blocked, completed, etc.) |
| StateMessage | `src/components/DataTable.tsx` | Mensagem de estado (loading, erro, vazio) |

## Servicos

| Funcao | Fonte | Descricao |
|---|---|---|
| invokeFunction | `src/services/admin.ts` | Chama Edge Functions via fetch direto (extrai erros reais) |
| requireAdminSession | `src/services/admin.ts` | Valida sessao e role bank_admin/super_admin |
| getDashboardSummary | Edge Function | Metricas globais + ultimas transacoes enriquecidas |
| listAccounts | Supabase direto | Profiles com busca, filtro por role e status |
| listWallets | Supabase direto | Wallets com filtro por status |
| listTransactions | enriched_transactions view | Transacoes com nomes e tipos dos participantes |
| getTransaction | enriched_transactions view | Detalhe de transacao com nomes, chaves e tipos |
| reverseTransaction | Edge Function | Estorno via reverse_transaction |
| changeWalletStatus | Edge Function | Bloquear/desbloquear via block_wallet |
| createOrganization | Edge Function | Criar escola via create_organization_account |
| linkOrganizationMember | Supabase direto | Vincular usuario a organizacao |
| listAuditLogs | Supabase direto | Logs de auditoria com filtros |
| listSecurityEvents | Supabase direto | Eventos de seguranca com filtro por severidade |
| listTransferLimits | Supabase direto | Limites por tipo de conta |
| updateTransferLimit | Supabase direto | Editar limites (RLS exige bank_admin) |
| exportCsv | Local | Gera CSV no browser e faz download |

## Rotas

| Rota | Funcionalidade |
|---|---|
| `/login` | Login Google OAuth, redireciona para /dashboard |
| `/dashboard` | Metricas, grafico transacoes/dia, ultimas transacoes com nomes |
| `/accounts` | Lista de perfis com busca, filtro por role/status, badges de tipo |
| `/wallets` | Lista de wallets, bloquear/desbloquear com motivo |
| `/transactions` | Lista com filtros (status, tipo, valor, wallet), nomes dos participantes |
| `/transactions/[id]` | Detalhe com nomes, chaves, badges, estorno com motivo, audit logs |
| `/organizations` | Criar escola, vincular usuario, lista de organizacoes |
| `/audit` | Logs de auditoria com filtros, export CSV |
| `/security-events` | Eventos de seguranca com filtro por severidade |
| `/limits` | Editar limites de transferencia por tipo de conta |
| `/settings` | Info do ambiente, logout |

## Badges de tipo de conta

Mesmos badges do mobile, agora no admin:

| Tipo | Cor | Label |
|---|---|---|
| personal | Azul | Aluno |
| business | Laranja | Empresa |
| sub_business | Roxo | Professor |
| system | Vermelho | Admin |

## Permissoes

O AdminShell valida sessao e role `bank_admin` ou `super_admin` via `requireAdminSession()`. Acoes sensiveis (estorno, bloqueio, criar organizacao) passam por Edge Functions que verificam role novamente no backend.

RLS policies permitem que bank_admin leia todas as tabelas (profiles, wallets, transactions, audit_logs, security_events, transfer_limits, organizations).

## Rodar local

```bash
cd ycbank
npm run dev:web
```

Abrir http://localhost:3000. Requer `.env` na raiz com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Deploy (Vercel)

Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` nas variaveis de ambiente do Vercel. Nao configure service_role_key no frontend.

Plano Free do Vercel fornece subdominio gratuito `seuapp.vercel.app`. Dominio proprio aguarda autorizacao de Fagner.
