# Estado Atual — 2026-06-24

## Progresso

177/229 itens do checklist MVP concluidos (77%).

## Mudancas desde 2026-06-23

### Sistema de Codigos Convite e Cadastro (2026-06-24)
- Migration completa: colunas de convite em organizations, dados pessoais em profiles
- 6 novas RPCs: generate_invite_code, validate_invite_code, register_with_invite, approve_or_reject_registration, transfer_from_org_wallet, admin_credit_wallet
- 6 novas Edge Functions: validate_invite, register_with_invite, approve_registration, org_wallet_summary, transfer_from_org, admin_credit_wallet
- Views: enriched_transactions com created_by, org_students_with_balance
- Web admin: email escola, codigos convite, aprovacoes pendentes, credito YC, PIN escola, alterar role

### Experiencia Colaborador (2026-06-24)
- /org-home: dashboard com saldo da escola, nome e role
- /students: lista de alunos com saldo, protegida por PIN
- BottomNav com variante staff (5 abas diferenciadas)
- Transferencia da conta da escola identificada por colaborador

### Correcoes Criticas (2026-06-24)
- Fix loop OAuth: detectSessionInUrl dinamico (true web, false nativo)
- Fix storage: localStorage na web, SecureStore no nativo
- Fix routing professor: sub_business → /org-home
- Fix profile universal: carrega direto de profiles (nao mais getWalletSummary)
- Fix extrato universal: detecta account_type para source correto
- Fix notificacoes: funciona para ambos tipos + "Limpar tudo"
- Fix org_wallet_summary: filtro por wallet.id (nao orgId)
- Perfil: data abertura de conta, nascimento DD/MM/AA

### UI/UX Premium v3 (2026-06-24)
- Glassmorphism: GlassCard com blur CSS, borda luminosa, highlight line
- Energia: botoes com glow dourado pulsante (Animated API), textShadow em saldos
- Poeira de Ouro: 14 particulas douradas animadas flutuantes
- Orbs Ambientais: 3 circulos de luz suave no fundo
- Novos tokens de cor: glass, glassBorder, glassHighlight, glassStrong, glow*, dust*, orb*
- 14 telas atualizadas com efeitos visuais premium
- BottomNav em glass com blur e glow
- Toast/Drawer em glass escuro com blur

### Correcoes de Transferencia e Cadastro (2026-06-24)
- Fix data nascimento: formato DD/MM/AAAA brasileiro com mascara automatica no cadastro
- Fix wallets_status_check: constraint agora aceita 'pending' (necessario para cadastro via convite)
- Fix transfer-confirm: detecta account_type e usa transferFromOrg para colaboradores
- Fix receive: busca young_key direto do profile (funciona para colaboradores sem wallet pessoal)
- Fix busca young_key: case-insensitive (lower() em ambos os lados) nas RPCs transfer_youngcoin_tx e transfer_from_org_wallet
- Tela alunos: botoes "Transferir" e "Receber" por aluno + botao "Receber pagamento" no topo
- Tela transfer: aceita parametro `to` na URL para pre-preencher chave de destino

### Dashboard Admin — Metricas Completas (2026-06-24)
- Edge Function admin_dashboard_summary reescrita com novas metricas
- Valor Corrente: soma de todos os saldos de wallets ativas (substitui volume)
- Contas ativas: alunos (personal) e escolas (business) separados
- Transacoes por periodo: hoje, mes e ano
- Estornos: total de transacoes tipo reversal
- Wallets restritas: bloqueadas + congeladas
- Eventos criticos: security_events com severity high/critical
- Dashboard reorganizado em 3 secoes: Financeiro, Contas Ativas, Transacoes
- Destaque visual no Valor Corrente (borda gold) e vermelho em metricas de risco

### Login Google OAuth no Admin (2026-06-24)
- Botao "Entrar com Google" com icone SVG na tela de login
- Login por email/senha mantido como alternativa
- onAuthStateChange processa callback OAuth automaticamente
- Verifica role bank_admin apos login Google (rejeita se nao for admin)
- Redirect URL configurada no Supabase: mygbank.vercel.app/login

### Correcoes Backend (2026-06-24)
- Fix CORS em todas as Edge Functions
- Fix invokeFunction: refresh de sessao automatico
- Fix exclusao/criacao de escola (token expirado + CORS)
- Fix views SECURITY INVOKER: enriched_wallets e enriched_transactions recriadas com security_invoker=on (respeita RLS do usuario que consulta)
- Fix dev:web script: caminho do next hoisted no monorepo corrigido

### Hardening de Seguranca (2026-06-24)
- REVOKE EXECUTE de `anon` em 20 funcoes SECURITY DEFINER (impede chamada direta via PostgREST sem login)
- REVOKE EXECUTE de `authenticated` em 8 funcoes somente-admin (admin_credit_wallet, approve_or_reject_registration, block_wallet_tx, create_organization_account_tx, reverse_transaction_tx, process_cancellation, rls_auto_enable)
- Fixar search_path em account_type_label, touch_updated_at, generate_young_key (previne search_path hijack)
- 6 RLS policies otimizadas com (select auth.uid()) em vez de auth.uid() (avalia uma vez por query, nao por linha)
- 5 indices criados em foreign keys sem cobertura (audit_logs, organization_members, organizations, profiles, security_events)
- Pendente: habilitar Leaked Password Protection (requer plano Supabase Pro $25/mes — Authentication > Settings > Security)

## O que funciona

### Backend (Supabase)
- Projeto Supabase ativo (regiao South America)
- 4+ migrations aplicadas
- 8+ tabelas com RLS + 2 views enriquecidas
- 13 Edge Functions deployadas (todas ACTIVE)
- Google OAuth configurado
- 4 tipos de conta: personal, business, sub_business, system
- Sistema completo de convite, cadastro, aprovacao
- Transferencia de colaborador (da conta da escola)
- Credito de YC pelo admin

### Mobile (Expo)
- UI premium: glassmorphism + energia + poeira de ouro + orbs
- BottomNav glass com 2 variantes (personal/staff)
- Login Google OAuth + fluxo de cadastro via convite
- Profile + wallet automaticos
- Transferencia real com ledger
- Pagamento via chave manual
- Recebimento via QR Code
- Extrato universal (pessoal ou escola) com filtros
- Notificacoes universais com "Limpar tudo"
- Perfil universal: dados pessoais, escola, chave, status, data abertura, nascimento DD/MM/AA
- Dashboard colaborador (/org-home) com saldo da escola
- Lista de alunos (/students) protegida por PIN
- Toast global glass com blur
- Mensagens de erro traduzidas

### Web Admin (Next.js)
- Tema dark navy + gold com marca MoneYoung
- Login admin via Google OAuth
- Login Google OAuth + email/senha
- Dashboard com metricas completas: valor corrente, contas ativas, transacoes dia/mes/ano, estornos, eventos criticos
- Listagem de contas, wallets, transacoes com filtros e badges
- Gerenciamento de organizacoes (criar, excluir, vincular, desvincular)
- Codigos convite gerados automaticamente e visiveis
- Aprovacoes pendentes (aprovar/recusar)
- Credito de YC para escolas
- PIN de escola e alteracao de role
- Auditoria + seguranca + limites + CSV
- Deploy Vercel producao (https://mygbank.vercel.app)

### Usuarios de teste
- Fred Melo (melfredfred25@gmail.com) — @ADM-fredmelo2238 (bank_admin)
- Frederic Melo (agentcodi01@gmail.com) — @agentcodi012430 (common_user)

## O que falta

### Fase 2 (9 itens restantes)
- Build Android: EAS, APK, teste em dispositivo, Google Play

### Fase 3 (9 itens restantes)
- Testes funcionais do painel admin (8 itens)
- Dominio proprio (aguardando autorizacao de Fagner)

### Fase 4 (37 itens)
- **Hardening de seguranca (15 itens):** revogar EXECUTE de anon/authenticated em RPCs sensiveis, fixar search_path em funcoes, otimizar RLS policies com (select auth.uid()), criar indices em foreign keys sem cobertura, habilitar leaked password protection
- Infraestrutura (5 itens): Supabase Pro, compute, backups
- Dados iniciais (6 itens): contas, creditos, limites
- Onboarding (4 itens): instrucoes, processos
- Seguranca pre-lancamento (6 itens): revisao final

### Fase 5 (13 itens)
- Lancamento e monitoramento

## Documentacao

16 documentos tecnicos:
- 00: Checklist MVP (177/229, 77%)
- 01: Visao geral (atualizado com convite, colaborador, UI premium)
- 02: Arquitetura (atualizado com sistema visual premium, OAuth web)
- 03: Banco de dados
- 04: Seguranca
- 05: Mobile (reescrito: nova estrutura, todos os componentes, servicos, fluxos)
- 06: Web admin (atualizado com codigos convite, aprovacoes, credito)
- 07: Edge Functions
- 08: Auditoria
- 09: Deploy
- 10: Roadmap
- 11: Estado 2026-06-16 (snapshot historico)
- 12: Redesign visual (reescrito: v3 glassmorphism/energia/dust/orbs)
- 13: Tipos de usuarios e relacionamentos
- 14: Estado 2026-06-19 (snapshot historico)
- 15: Estado 2026-06-23 (snapshot historico)
- 16: Estado 2026-06-24 (este documento)
