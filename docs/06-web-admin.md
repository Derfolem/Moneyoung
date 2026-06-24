# Web Admin — MoneYoung Admin

Data: 2026-06-16 (atualizado 2026-06-24)

## Estrutura

`apps/web-admin` usa Next.js 14 App Router, TypeScript, Supabase client, layout administrativo com sidebar dark navy + gold e tabelas reutilizaveis.

## Identidade Visual

Tema dark navy (#0A1628) + gold (#D4A843), consistente com o mobile. CSS custom properties em `globals.css` definem toda a paleta. Fontes: Josefin Sans 700 (marca) e Inter 400-900 (UI) via Google Fonts `@import`.

| Variavel CSS | Cor | Uso |
|---|---|---|
| `--navy-deep` | `#0A1628` | Fundo body |
| `--navy-card` | `#0F2035` | Cards, sidebar, tabelas |
| `--navy-light` | `#162D4A` | Inputs, headers de tabela |
| `--gold` | `#D4A843` | Botoes, marca, links ativos, acentos |
| `--text-primary` | `#FFFFFF` | Texto principal |
| `--text-secondary` | `#8B9DC3` | Texto secundario |
| `--border` | `#1E3A5F` | Bordas gerais |
| `--border-gold` | `rgba(212,168,67,0.3)` | Bordas douradas em cards |

A marca "MoneYoung" aparece no sidebar em Josefin Sans 700 com cor gold, separada por borda dourada. Links ativos no sidebar tem fundo gold translucido e borda esquerda gold. Avatar do usuario logado no rodape do sidebar.

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
| getDashboardSummary | Edge Function | Metricas completas: valor corrente, contas ativas, transacoes dia/mes/ano, estornos, wallets, restritas, eventos criticos + ultimas transacoes |
| listAccounts | Supabase direto | Profiles com busca, filtro por role e status |
| listWallets | Supabase direto | Wallets com filtro por status |
| listTransactions | enriched_transactions view | Transacoes com nomes e tipos dos participantes |
| getTransaction | enriched_transactions view | Detalhe de transacao com nomes, chaves e tipos |
| reverseTransaction | Edge Function | Estorno via reverse_transaction |
| changeWalletStatus | Edge Function | Bloquear/desbloquear via block_wallet |
| createOrganization | Edge Function | Criar escola via create_organization_account (gera codigos convite) |
| linkOrganizationMember | Supabase direto | Vincular usuario a organizacao |
| approveRegistration | Edge Function | Aprovar/rejeitar cadastro via approve_registration |
| adminCreditWallet | Edge Function | Creditar YC na wallet de escola |
| listAuditLogs | Supabase direto | Logs de auditoria com filtros |
| listSecurityEvents | Supabase direto | Eventos de seguranca com filtro por severidade |
| listTransferLimits | Supabase direto | Limites por tipo de conta |
| updateTransferLimit | Supabase direto | Editar limites (RLS exige bank_admin) |
| exportCsv | Local | Gera CSV no browser e faz download |

## Rotas

| Rota | Funcionalidade |
|---|---|
| `/login` | Login Google OAuth (botao "Entrar com Google") + email/senha, redireciona para /dashboard |
| `/dashboard` | Metricas completas: valor corrente, contas aluno/escola ativas, transacoes dia/mes/ano, estornos, wallets, restritas, eventos criticos. Grafico transacoes/dia, ultimas transacoes |
| `/accounts` | Lista de perfis com busca, filtro por role/status, badges de tipo |
| `/wallets` | Lista de wallets, bloquear/desbloquear com motivo |
| `/transactions` | Lista com filtros (status, tipo, valor, wallet), nomes dos participantes |
| `/transactions/[id]` | Detalhe com nomes, chaves, badges, estorno com motivo, audit logs |
| `/organizations` | Criar escola (com email, gera codigos convite), vincular/desvincular membros, alterar role, definir PIN, codigos visiveis na tabela |
| `/approvals` | Cadastros pendentes de aprovacao (aprovar/recusar com motivo) |
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
cd MYGbank
npm run dev:web
```

Abrir http://localhost:3000. Requer `.env` na raiz com `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Deploy (Vercel)

Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` nas variaveis de ambiente do Vercel. Nao configure service_role_key no frontend.

Plano Free do Vercel fornece subdominio gratuito `seuapp.vercel.app`. Dominio proprio aguarda autorizacao de Fagner.
