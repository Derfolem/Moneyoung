# Estado Atual — 2026-06-29

## Progresso

225/314 itens do checklist MVP concluidos (72%).
(Checklist expandido com secao 2.10 iOS — 62 novos itens; progresso absoluto mantido)

---

## Sessao 1 — Codex (manha, 2026-06-29)

Redesign visual v4 completo alinhado ao mockup original do projeto, realizado pelo Codex.

### Redesign Visual v4 — Paleta do Mockup

Paleta escurecida para tons proximos do preto azulado, alinhada ao mockup original de Fagner.

**Mobile (`apps/mobile/src/theme/colors.ts`):**
- `navyDeep`: `#0A1628` → `#00070D`
- `navyCard`: `#0F2035` → `#03131D`
- `navyLight`: `#162D4A` → `#061E2A`
- `gold`: `#D4A843` → `#D99A26`
- `goldDark`: `#B8912F` → `#9F6508`
- `goldLight`: `#E8C66A` → `#F3C65E`
- Novos tokens: `navyInk (#000306)`, `goldPale (#FFE2A1)`, `textMuted (#6F8594)`, `input (rgba(0,10,16,0.74))`

**Telas Mobile:** login simplificado (so Google + criar conta), home com avatar+saudacao+notif, atalhos +10/+50/+100/+200 no transfer, BottomNav com botao YC central dourado elevado, TransactionRow flat, statement com saldo em GlassCard, ordenacao por data em todas as listas.

**Web Admin:** gradientes, blur, box-shadow, botoes com gradiente gold.

### Commits da sessao 1

```
a399670  docs: estado atual 2026-06-29 e atualizacao documentacao redesign v4
c1ada00  feat(mobile): atalhos de valor na transferencia e ajustes visuais
3bc60cc  [historico anterior]
```

---

## Sessao 2 — Sistema de Exclusao e Purge (tarde, 2026-06-29)

### O que foi implementado

#### Banco de dados (migrations aplicadas)

**Migration `20260629135331_soft_delete_and_purge`:**
- `organizations.status` aceita `'deleted'`
- `wallets.status` aceita `'deleted'`
- Coluna `deleted_at timestamptz` em `organizations` e `profiles`
- RPC `soft_delete_organization(p_org_id, p_actor_id, ...)`: marca org + todos os membros + wallets como deleted; transacoes preservadas
- RPC `hard_purge_organization(...)`: elimina tudo permanentemente (nullifica FKs em transactions antes de deletar)
- RPC `hard_purge_profile(...)`: elimina perfil individual permanentemente
- Todas as RPCs revogadas de `anon` e `authenticated`

**Migration `20260629160000_fix_soft_delete_org_members_status`:**
- `organization_members.status` aceita `'deleted'`
- `soft_delete_organization` atualizado para marcar tambem `organization_members.status = 'deleted'` (necessario para bloquear org_wallet_summary)

**Migration `20260629170000_fix_register_with_invite_allow_deleted_reactivation`:**
- `register_with_invite` agora detecta perfil `deleted` e reativa em vez de rejeitar
- Reativacao: novos dados (nome, data nasc., etc.), status=pending, novo young_key, wallet existente reaproveitada (mesmo ID — historico preservado), vinculos antigos marcados deleted, novo vinculo criado
- Perfil ativo: ainda lanca `PROFILE_ALREADY_EXISTS`
- Audit log diferenciado: `profile.registered_via_invite` vs `profile.reactivated_via_invite`

#### Edge Functions (deployadas)

| Funcao | Versao | O que faz |
|---|---|---|
| `delete_organization` | v1 | Soft-delete via banco (requer bank_admin) |
| `purge_data` | v1 | Hard-purge de org ou perfil (requer bank_admin) |
| `create_profile_on_first_login` | v6 | Pre-check: rejeita perfis deleted com INVITE_REQUIRED |
| `get_wallet_summary` | v5 | Rejeita perfis deleted com ACCOUNT_DELETED 403 |
| `org_wallet_summary` | v3 | Pre-check de profile.status antes de checar membership |
| `transfer_youngcoin` | v4 | assertActiveProfile logo apos autenticacao |
| `transfer_from_org` | v2 | assertActiveProfile logo apos autenticacao |
| `request_cancellation` | v2 | assertActiveProfile logo apos autenticacao |

**`_shared/supabase.ts`:** nova funcao `assertActiveProfile(serviceClient, userId)` — consulta DB e rejeita se `status = 'deleted'`.

#### Web Admin (painel)

**Organizacoes (`organizations/page.tsx`):**
- Botao "Desativar" (substituiu "Excluir") → soft-delete com modal de aviso amarelo
- Badge "Excluida" inline na tabela para orgs com `status='deleted'`
- Toggle "Mostrar excluidas" para filtrar
- Botao "Limpar Dados" (vermelho) so visivel para orgs ja excluidas → modal exige digitar o nome da escola para confirmar

**Contas (`accounts/page.tsx`):**
- Coluna "Acoes" com botao "Limpar Dados" para contas `deleted`
- Modal exige digitar o email da conta para confirmar
- Filtro de status inclui `deleted`

**DataTable (`StatusPill`):**
- Labels em pt-BR: Ativo, Bloqueado, Pendente, Excluido, Cancelado
- `.pill-deleted` e `.pill-cancelled` no CSS (cinza neutro)

**`packages/shared/src/index.ts`:**
- `ProfileStatus` inclui `'deleted'`
- `WalletStatus` inclui `'deleted'` e `'pending'`

#### App Mobile

**Bloqueio de contas deletadas:**
- `home.tsx`: ao receber `ACCOUNT_DELETED`, chama `signOut()` e redireciona para `/login`
- `org-home.tsx`: idem, tambem captura "colaborador ativo" (org_wallet_summary)
- `login.tsx handleSession`: verifica `profile.status === 'deleted'` apos query; faz signOut + toast "Cadastro necessario"
- Comportamento: conta deletada recebe a mesma mensagem de usuario sem convite (nao diferencia para o usuario final)

**Fix navegacao (back button):**
- `home.tsx` e `org-home.tsx`: `useEffect` trocado por `useFocusEffect`
- Ao navegar de volta para essas telas sem sessao valida, `load()` e reexecutado, detecta UNAUTHENTICATED e redireciona para `/login` em vez de mostrar dados cacheados

---

## Sessao 4 — Fix: Carteira de Colaboradores (noite, 2026-06-29)

### Problema

Transferencia de aluno para colaborador retornava 422. Causa raiz: colaboradores (`sub_business`) nao tinham carteira pessoal — `register_with_invite` so criava wallet para alunos (code_type='student').

O RPC `transfer_youngcoin_tx` buscava `wallets WHERE profile_id = colaborador.id AND status = 'active'`, nao encontrava nada, lancava `DESTINATION_WALLET_NOT_FOUND`, e o edge function (v5) nao tratava esse erro especifico → fallthrough para catch-all → 422.

### O que foi implementado

**Migration `20260629200000_create_wallet_for_staff`:**
- `INSERT INTO wallets` para todos os colaboradores (`account_type = 'sub_business'`) que nao tinham wallet — restaura acesso imediato
- `CREATE OR REPLACE FUNCTION register_with_invite`: na criacao de novo perfil e na reativacao, cria `wallet_type = v_account_type` (personal para aluno, sub_business para colaborador)

**Edge function `transfer_youngcoin` v6:**
- Novo tratamento explicito de `DESTINATION_WALLET_NOT_FOUND` → 404 com mensagem clara em vez de 422 generico
- Ordem de precedencia no `if/else`: `DESTINATION_WALLET_NOT_FOUND` antes de `DESTINATION_NOT_FOUND` para evitar substring match incorreto

---

## Sessao 3 — Controles de Transferencia (noite, 2026-06-29)

### O que foi implementado

**Bloqueio aluno → aluno (`20260629190000_block_peer_transfer`):**
- RPC `transfer_youngcoin_tx` rejeita transferencia quando remetente e destinatario sao ambos `account_type = 'personal'`
- Lanca `PEER_TRANSFER_BLOCKED`; registra `security_event` com severity 'low' para auditoria
- Edge function `transfer_youngcoin` v5 devolve erro 403 com mensagem em pt-BR
- Colaboradores (`sub_business`) e banco (`system`) sem restricao de destinatario

**Edge function `get_school_contacts` v2:**
- Retorna lista completa de contatos da escola filtrando por papel inverso:
  - Aluno (personal) → colaboradores ativos (teacher, staff, admin)
  - Colaborador (sub_business) → alunos ativos (student)
- Tambem retorna `recent_contacts`: ate 5 ultimos destinatarios unicos com base no historico real de transacoes (cross-referenciados com membros ativos da escola)
- Retorna `account_type` para a tela saber qual label exibir

**Tela de transferencia (`transfer.tsx`) — redesign:**
- **Cards "Recentes":** ate 5 cards horizontais com avatar (iniciais), primeiro nome e cargo abreviado (Prof./Func./Dir./Aluno) — so aparece se houver historico
- **Lista suspensa com busca:** modal slide-up com:
  - Campo de busca por nome OU chave MoneYoung (filtragem instantanea client-side)
  - Contador de resultados ("N colaboradores da escola" / "X resultados")
  - FlatList virtualizado — suporta 5000+ entradas sem travamento
  - Cada linha: avatar com iniciais, nome completo, chave MoneYoung, badge de cargo, checkmark no selecionado
  - Fechar com X ou gesto back
- **Seleção:** toque em card recente ou linha da lista preenche o campo e move o foco para o campo de valor automaticamente
- Campo de chave ainda aceita digitação manual (para chaves fora da escola)

### Commits da sessao 3

```
8d63fc8  fix(mobile): modal de busca vira bottom sheet (72% da tela)
f89295e  feat: lista suspensa com busca + cards de recentes na transferencia
7280717  feat: lista de contatos da escola na tela de transferencia
ba6dc6c  feat: bloqueia transferencia entre alunos (personal → personal)
```

### Commits da sessao 4

```
d45a4d1  fix+feat: carteira colaborador, dashboard e sistema de alertas
2ee75b5  fix: destino exibe nome da escola + badge Escola em transacoes
a36d856  fix(web): suppressHydrationWarning no html para extensoes de browser
29ad826  docs: registra fix hydration warning e itens 3.1f/3.1g no checklist
009df26  docs: checklist secoes 3.1f e 3.1g marcadas como testado e aprovado
0a14021  docs: checklist completo para publicacao na Apple App Store (secao 2.10)
```

---

## Sessao 2 — Sistema de Exclusao e Purge (tarde, 2026-06-29)

### O que foi implementado

### Commits da sessao 2

```
dc9f44c  fix: re-cadastro com email deletado + back button mostra perfil antigo
f3a2e2c  fix: bloquear conta deletada em todas as edge functions de usuario
ca58494  fix: bloquear conta deletada na tela de login
6ff40fa  fix(edge): org_wallet_summary bloqueia profiles com status deleted
7f7aba8  fix: soft-delete bloqueia acesso no app mobile
adf1d2e  chore(db): salvar arquivo local da migration soft_delete_and_purge
c18eb5e  feat(admin): soft-delete e purge de orgs/contas com modais de confirmacao dupla
983ec68  feat(edge): delete_organization (soft-delete) e purge_data (hard purge) deployados
5bd0d36  feat: tipos ProfileStatus/WalletStatus com 'deleted'; StatusPill em pt-BR; pill-deleted
```

---

## O que funciona

### Backend (Supabase)
- Projeto ativo (regiao South America)
- 18 migrations aplicadas
- 8+ tabelas com RLS, 2 views enriquecidas
- 15 Edge Functions deployadas (todas ACTIVE) — transfer_youngcoin em v6
- Google OAuth configurado
- 4 tipos de conta: personal, business, sub_business, system
- Sistema completo de convite, cadastro, aprovacao, reativacao
- Transferencia de colaborador (da conta da escola)
- Credito de YC pelo admin
- **NOVO:** Soft-delete de org (membros + wallets marcados deleted)
- **NOVO:** Hard-purge permanente de org ou perfil individual (com ordem FK segura)
- **NOVO:** Reativacao de perfil deleted via novo invite code

### Mobile (Expo)
- UI v4: paleta do mockup (#00070D + #D99A26), glassmorphism refinado, ondas decorativas
- Login simplificado: apenas Google OAuth + criar conta
- BottomNav com botao YC central dourado elevado
- Transacoes ordenadas por data em todas as telas
- **NOVO:** Conta deletada bloqueada no login (mesma mensagem de sem cadastro)
- **NOVO:** Todas as edge functions bloqueiam conta deleted
- **NOVO:** useFocusEffect em home/org-home (sem perfil antigo ao voltar)
- **NOVO:** Transferencia bloqueada entre alunos (personal → personal)
- **NOVO:** Tela de transferencia com modal de busca por nome + cards de recentes (ate 5)
- **NOVO:** Banner "Educacao Financeira — Em breve" na home do aluno
- **NOVO:** Aviso YC sem valor monetario contextual (saldo, transferencia, QR code)
- **FIX:** Transferencia para colaborador funciona — wallet sub_business criada para todos os colaboradores existentes
- **FIX:** Transacoes no painel: nome do professor como origem, nome da escola como destino

### Web Admin (Next.js)
- Tema dark navy-black + gold
- Deploy Vercel producao (https://mygbank.vercel.app)
- **NOVO:** Soft-delete e hard-purge com modais de confirmacao dupla
- **NOVO:** Badges pt-BR (Excluida, Ativo, Bloqueado, etc.)
- **NOVO:** Toggle "Mostrar excluidas" e filtro de status deleted
- **FIX:** Dashboard: "Escolas" corrigido (organizations); "Alunos" → "Total de Usuarios" (personal + sub_business)
- **FIX:** Transacoes: nome do professor como origem + nome da escola como destino; badge "Escola" em vez de "Empresa"
- **NOVO:** Pagina /alerts com todos os erros do app; metrica "Erros Hoje" no dashboard
- **FIX:** suppressHydrationWarning no layout.tsx — elimina warning de extensoes de browser (LanguageTool, etc.)

---

## O que falta

### Prioridade alta (bloqueadores de lancamento)

1. **Build Android** (secao 2.9): EAS + APK + teste fisico + Google Play
2. **Sign in with Apple** (2.10.2): obrigatorio pela Apple para apps com login Google
3. **Politica de privacidade** (2.10.4): URL publica necessaria para ambas as stores
4. **Dados iniciais** (4.2): conta admin real, escola real, credito YC, limites

### Prioridade media

5. **Build iOS** (secao 2.10): certificados, App Store Connect, screenshots, submissao
6. **Supabase Pro** (4.1): recomendado para 400 alunos simultaneos ($25/mes)
7. **Exportar CSV** (3.2): testar via browser
8. **Dominio proprio** (3.3): aguardando autorizacao de Fagner

### Para amanha (proxima sessao sugerida)

- Iniciar build Android: configurar EAS, gerar APK preview
- Ou: criar pagina de politica de privacidade (desbloqueia ambas as stores)
- Ou: configurar Sign in with Apple no Supabase + app mobile

---

## Documentacao

17 documentos tecnicos em `docs/`:
- 00: Checklist MVP (225/314, 72% — expandido com iOS secao 2.10)
- 01-13: Documentacao tecnica (arquitetura, banco, seguranca, mobile, web admin, edge functions, auditoria, deploy, roadmap, tipos de usuarios)
- 14-16: Snapshots historicos (2026-06-19, 2026-06-23, 2026-06-24)
- 17: Este documento (estado 2026-06-29)
