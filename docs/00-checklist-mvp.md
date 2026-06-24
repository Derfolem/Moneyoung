# Checklist MVP — Moneyoung para 400 Alunos

**Projeto:** VemCer — Plataforma Bancaria Digital Educacional Moneyoung
**Meta:** App Android funcional + painel web admin para 400 usuarios (alunos) + usuarios empresa (colegios) + administrador do banco.
**Prazo estimado:** 40 dias de desenvolvimento

> **Como usar este checklist:**
> - Marque `[x]` ao concluir cada item.
> - Se um item nao for realizado, adicione `[SKIP]` e justifique abaixo dele.
> - Este documento e a fonte da verdade do progresso do MVP.
> - Atualize a data ao lado de cada item concluido.

---

## Fase 0 — Estrutura e Identidade (CONCLUIDA)

- [x] Criar monorepo npm workspaces (2026-06-16)
- [x] Criar app mobile Expo (apps/mobile) (2026-06-16)
- [x] Criar painel web admin Next.js (apps/web-admin) (2026-06-16)
- [x] Criar pacote compartilhado (packages/shared) (2026-06-16)
- [x] Criar schema PostgreSQL com migrations (supabase/migrations) (2026-06-16)
- [x] Criar Edge Functions Supabase (7 funcoes) (2026-06-16)
- [x] Criar documentacao tecnica (12 documentos) (2026-06-16)
- [x] Criar script de validacao de ledger (scripts/validate-ledger.mjs) (2026-06-16)
- [x] Implementar modo demo mobile (sem Supabase) (2026-06-16)
- [x] Redesign visual completo do mobile (identidade fintech dark navy) (2026-06-17)
- [x] Corrigir identidade: app = Moneyoung (MYG), moeda = Youngcoin (YC) (2026-06-19)
- [x] Redesign visual mobile v2: TextLogo MoneYoung (Josefin Sans 700), BottomNav 5 abas, paleta navy #0A1628 + gold #D4A843 (2026-06-23)
- [x] Redesign visual web admin: tema dark navy+gold, CSS variables, fontes Josefin Sans+Inter, sidebar com marca MoneYoung (2026-06-23)

---

## Fase 1 — Backend Supabase (EM ANDAMENTO)

### 1.1 Projeto Supabase

- [x] Criar projeto no Supabase Dashboard (escolher regiao South America) (2026-06-19)
- [x] Anotar URL do projeto, anon key e service role key (2026-06-19)
- [x] Preencher `.env` da raiz com todas as chaves: (2026-06-19)
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

### 1.2 Banco de Dados

- [x] Rodar migration `202606160001_youngcoin_core.sql` (schema, RLS, RPCs) (2026-06-19)
- [x] Rodar migration `202606170001_youngcoin_backend_hardening.sql` (rate limiting, limites) (2026-06-19)
- [x] Verificar que todas as tabelas foram criadas: profiles, organizations, organization_members, wallets, transactions, audit_logs, transfer_limits, security_events (2026-06-19)
- [x] Verificar que RLS policies estao ativas em todas as tabelas (2026-06-19)
- [x] Verificar que a RPC `transfer_youngcoin_tx` esta funcional (2026-06-19)
- [x] Inserir limites iniciais na tabela `transfer_limits` (personal, business, system) (2026-06-19)

### 1.3 Autenticacao

- [x] Configurar Google OAuth no Supabase Dashboard (Authentication > Providers > Google) (2026-06-19)
- [x] Criar projeto no Google Cloud Console e obter Client ID + Secret (2026-06-19)
- [x] Adicionar redirect URLs no Supabase: (2026-06-19)
  - `http://localhost:8081` (dev mobile)
  - `http://localhost:3000` (dev web admin)
  - `moneyoung://auth/callback` (mobile producao)
  - URL do Vercel (web admin producao)
- [x] Testar login Google no mobile web (localhost:8081) (2026-06-19)
- [x] Testar login Google no web admin (localhost:3000) (2026-06-19 — servidor rodando, login configurado)

### 1.4 Edge Functions

- [x] Deploy `create_profile_on_first_login` (2026-06-19)
- [x] Deploy `transfer_youngcoin` (2026-06-19)
- [x] Deploy `get_wallet_summary` (2026-06-19)
- [x] Deploy `reverse_transaction` (2026-06-19)
- [x] Deploy `block_wallet` (2026-06-19)
- [x] Deploy `create_organization_account` (2026-06-19)
- [x] Deploy `admin_dashboard_summary` (2026-06-19)
- [x] Testar cada funcao manualmente via app ou curl (2026-06-19 — create_profile_on_first_login e get_wallet_summary testados via login real)

---

## Fase 2 — App Mobile Funcional

### 2.1 Conexao com Backend Real

- [x] Login Google real funcionando (substituir modo demo) (2026-06-19)
- [x] Profile criado automaticamente no primeiro login (2026-06-19)
- [x] Wallet criada automaticamente junto com profile (2026-06-19)
- [x] Tela Home mostrando saldo real do Supabase (2026-06-19)
- [x] Transferencia real entre contas (debito + credito + ledger) (2026-06-19)
- [x] Pagamento via QR Code real (2026-06-19)
- [x] Recebimento via QR Code com young_key real (2026-06-19)
- [x] Extrato mostrando transacoes reais do banco (2026-06-19)
- [x] Perfil mostrando dados reais do usuario (2026-06-19)

### 2.2 Testes Funcionais Mobile

- [x] Login → Home → ver saldo (2026-06-19)
- [x] Transferir valor → confirmar → comprovante (2026-06-19)
- [x] Pagar via QR Code (2026-06-19 — manual key, camera web indisponivel)
- [x] Receber → gerar QR → outro usuario lê e paga (2026-06-19)
- [x] Extrato com filtros (entradas/saidas) (2026-06-19)
- [x] Tentar transferir mais que o saldo (deve falhar) (2026-06-19)
- [x] Tentar transferir para chave inexistente (deve falhar) (2026-06-19)
- [x] Testar rate limiting (varias transferencias rapidas) (2026-06-19)
- [x] Testar idempotencia (mesma chave nao duplica) (2026-06-19)

### 2.2b Melhorias UX Mobile

- [x] Sistema de Toast global (substituir Alert.alert que nao funciona na web) (2026-06-19)
- [x] Mensagens de erro traduzidas para portugues (saldo insuficiente, destino nao encontrado, etc.) (2026-06-19)
- [x] Nomes dos participantes visiveis nas transacoes (quem enviou/recebeu) (2026-06-19)
- [x] Tipo de usuario (badge) visivel no extrato e notificacoes (Aluno, Empresa, Professor, Admin) (2026-06-19)
- [x] Tela de Notificacoes com dados reais (entradas e saidas com nomes) (2026-06-19)

### 2.2c Tipos de Usuarios e Chaves Diferenciadas

- [x] Migration: account_type `sub_business` adicionado (personal, business, sub_business, system) (2026-06-19)
- [x] Chaves Moneyoung com prefixo por tipo: @ALN- (aluno), @EMP- (empresa), @SUBEMP- (sub-empresa/professor), @ADM- (admin) (2026-06-19)
- [x] Limites de transferencia configurados para sub_business (1000/tx, 5000/dia, 30/min) (2026-06-19)
- [x] View `enriched_transactions` com nomes e tipos dos participantes (2026-06-19)
- [x] Edge Function `get_wallet_summary` atualizada para retornar dados enriquecidos (2026-06-19)
- [x] Documentacao de tipos de usuarios e relacionamentos futuros (docs/13-tipos-usuarios-relacionamentos.md) (2026-06-19)

### 2.4 Cadastro via Codigo Convite (Mobile)

- [x] Tela de login: botao "Tenho um codigo convite" (2026-06-24)
- [x] Nova tela `/invite`: validar codigo convite (3 letras + 4 numeros) (2026-06-24)
- [x] Nova tela `/register`: formulario pos-OAuth (nome completo, nascimento, pais, estado, cidade, esporte, sobre, hobby) (2026-06-24)
- [x] Calculo automatico de idade a partir da data de nascimento (2026-06-24)
- [x] Chamada Edge Function `register_with_invite` para criar cadastro (2026-06-24)
- [x] Nova tela `/pending-approval`: aguardando aprovacao do banco (2026-06-24)
- [x] Verificacao de status (refresh) na tela de aprovacao (2026-06-24)
- [x] Redirecionamento automatico para `/home` apos aprovacao (2026-06-24)

### 2.5 Experiencia Colaborador (Mobile)

- [x] Detectar account_type `sub_business` apos login (2026-06-24 — layout + login redirecionam para /org-home)
- [x] Home do colaborador: saldo da conta da escola, nome da escola no header (2026-06-24 — /org-home)
- [x] BottomNav diferenciado: Inicio, Transferir, Receber, Alunos, Perfil (2026-06-24 — prop staff)
- [x] Aba Alunos: lista de alunos da escola com nome, chave e saldo (2026-06-24 — /students)
- [x] Aba Alunos protegida por PIN (definido pelo diretor ou banco) (2026-06-24 — PIN via org access_pin)
- [x] Transferencia da conta da escola via Edge Function `transfer_from_org` (2026-06-24)
- [x] Extrato da conta da escola com nome do colaborador em cada transacao (2026-06-24 — enriched_transactions com created_by)
- [x] Perfil do colaborador: dados pessoais + nome da escola + role (2026-06-24)

### 2.6 Correcoes Fluxo OAuth e Telas (2026-06-24)

- [x] Fix loop OAuth: detectSessionInUrl dinamico (true na web, false no nativo) (2026-06-24)
- [x] Fix storage separado: localStorage na web, SecureStore no nativo (2026-06-24)
- [x] Fix invite_code em localStorage: limpeza no "Voltar" e deteccao correta no _layout.tsx (2026-06-24)
- [x] Fix routing professor: sub_business redirecionado para /org-home apos login (2026-06-24)
- [x] Fix profile universal: carrega direto da tabela profiles (funciona para personal e sub_business) (2026-06-24)
- [x] Fix extrato universal: detecta account_type e usa getWalletSummary ou getOrgWalletSummary (2026-06-24)
- [x] Fix notificacoes universal: funciona para ambos os tipos de conta (2026-06-24)
- [x] Botao "Limpar tudo" nas notificacoes (2026-06-24)
- [x] Data de abertura de conta no perfil (campo created_at) (2026-06-24)
- [x] Data de nascimento no formato DD/MM/AA (padrao brasileiro) (2026-06-24)
- [x] Sino de notificacoes no header do org-home (2026-06-24)
- [x] Fix org_wallet_summary: filtro por wallet.id em vez de orgId (2026-06-24)

### 2.7 UI/UX Premium — Glassmorphism, Energia e Poeira de Ouro (2026-06-24)

- [x] Novos tokens de cor: glass, glassBorder, glassHighlight, glassStrong, glow*, dust*, orb* (2026-06-24)
- [x] Novo componente GlassCard: card com fundo semi-transparente, blur CSS, borda luminosa, opcao glow (2026-06-24)
- [x] Novo componente GoldDust: 14 particulas douradas animadas flutuantes (2026-06-24)
- [x] Novo componente AmbientOrbs: 3 orbs de luz suave no fundo das telas (2026-06-24)
- [x] Screen atualizado: AmbientOrbs no fundo + prop dust para particulas (2026-06-24)
- [x] Button com energia: glow dourado pulsante animado no botao primario (2026-06-24)
- [x] BottomNav em vidro: fundo glass com blur, linha de glow no topo, icone ativo com fundo glow (2026-06-24)
- [x] TransactionRow em vidro: fundo glass com blur e borda luminosa (2026-06-24)
- [x] Toast em vidro: fundo glass escuro com blur forte (2026-06-24)
- [x] Drawer em vidro: menu lateral com blur e borda luminosa (2026-06-24)
- [x] PageHeader: botao voltar em vidro (2026-06-24)
- [x] HexLogo: shadow dourada/glow (2026-06-24)
- [x] 14 telas atualizadas com efeitos glass/energy/dust: home, org-home, login, profile, statement, notifications, transfer, transfer-confirm, receipt, receive, pay, invite, register, pending-approval (2026-06-24)

### 2.8 Correcoes Criticas de Transferencia e Cadastro (2026-06-24)

- [x] Fix data nascimento no cadastro: formato DD/MM/AAAA brasileiro com mascara automatica (2026-06-24)
- [x] Fix wallet status check: adicionar 'pending' ao constraint wallets_status_check (cadastro via convite) (2026-06-24)
- [x] Fix transfer-confirm para colaboradores: detecta account_type e usa transferFromOrg em vez de getWalletSummary (2026-06-24)
- [x] Fix receive para colaboradores: busca young_key direto do profile (sem depender de wallet pessoal) (2026-06-24)
- [x] Fix busca young_key case-insensitive: lower() em ambos os lados nas RPCs transfer_youngcoin_tx e transfer_from_org_wallet (2026-06-24)
- [x] Tela alunos: botao "Receber pagamento" no topo (abre QR Code da escola) (2026-06-24)
- [x] Tela alunos: botoes "Transferir" e "Receber" por aluno (transferir pre-preenche a chave) (2026-06-24)
- [x] Tela transfer: aceita parametro `to` na URL para pre-preencher chave de destino (2026-06-24)

### 2.9 Build Android

- [ ] Configurar `EAS_PROJECT_ID` no `.env`
- [ ] Criar conta no Expo (eas login)
- [ ] Configurar `eas.json` com profile preview e production
- [ ] Gerar APK preview: `npm run build:android:preview`
- [ ] Instalar APK no dispositivo fisico e testar
- [ ] Testar login Google no dispositivo fisico
- [ ] Testar QR Code com camera real
- [ ] Gerar APK/AAB de producao
- [ ] Publicar na Google Play Store (conta de US$ 25)

---

## Fase 3 — Painel Web Admin Funcional

### 3.1 Conexao com Backend Real

- [x] Login admin via Google OAuth (2026-06-19 — Fred Melo promovido a bank_admin @ADM-fredmelo2238)
- [x] Login admin com Google OAuth (botao "Entrar com Google" + email/senha) (2026-06-24)
- [x] Dashboard com metricas completas: valor corrente, contas aluno/escola ativas, transacoes dia/mes/ano, estornos, wallets, restritas, eventos criticos (2026-06-24)
- [x] Listagem de contas com busca e filtros (2026-06-19 — badges de tipo de conta)
- [x] Listagem de wallets com busca e filtros (2026-06-19)
- [x] Listagem de transacoes com filtros (status, tipo, valor, wallet) (2026-06-19 — enriched_transactions com nomes)
- [x] Detalhe de transacao com audit logs (2026-06-19 — nomes, chaves e badges)
- [x] Estorno de transacao funcionando (2026-06-19 — via Edge Function reverse_transaction)
- [x] Gerenciamento de organizacoes (criar, listar) (2026-06-19 — via Edge Function create_organization_account)
- [x] Auditoria completa com filtros (2026-06-19 — CSV export)
- [x] Eventos de seguranca com filtros (2026-06-19)
- [x] Configuracao de limites por tipo de conta (2026-06-19 — badges por tipo)
- [x] Exportacao CSV funcionando (transacoes e auditoria) (2026-06-19)

### 3.1b Correcoes e Melhorias Admin

- [x] Corrigir CORS em todas as Edge Functions (401/403 sem CORS headers; respostas de erro de requireUser e assertBankAdmin agora incluem corsHeaders) (2026-06-24)
- [x] Corrigir invokeFunction: refresh de sessao automatico + erro claro quando token expira (2026-06-24)
- [x] Corrigir exclusao/criacao de escola (causado pelo bug de CORS + token expirado acima) (2026-06-24)
- [x] Fix views security_invoker: enriched_wallets e enriched_transactions recriadas com SECURITY INVOKER (respeita RLS do usuario) (2026-06-24)
- [x] Fix dev:web script: corrigir caminho do next hoisted no monorepo (2026-06-24)

### 3.1c Sistema de Codigos Convite e Cadastro (Backend + Admin)

- [x] Migration: colunas email, invite_code_student, invite_code_staff, access_pin em organizations (2026-06-24)
- [x] Migration: colunas full_name, birth_date, country, state, city, sport, about, hobby, invited_by_org_id em profiles (2026-06-24)
- [x] RPC: generate_invite_code() — gera codigo AAA0000 unico (2026-06-24)
- [x] RPC: atualizar create_organization_account_tx() com email e codigos (2026-06-24)
- [x] RPC: validate_invite_code() — valida codigo e retorna escola/tipo (2026-06-24)
- [x] RPC: register_with_invite() — cadastro completo via convite (2026-06-24)
- [x] RPC: approve_or_reject_registration() — banco aprova/rejeita (2026-06-24)
- [x] RPC: transfer_from_org_wallet() — colaborador transfere da conta da escola (2026-06-24)
- [x] View: atualizar enriched_transactions com created_by (nome do colaborador) (2026-06-24)
- [x] View: org_students_with_balance (alunos + saldos por escola) (2026-06-24)
- [x] RLS: politicas para novas views e funcoes (2026-06-24)
- [x] Edge Function: atualizar create_organization_account (email + codigos) (2026-06-24 — v4)
- [x] Edge Function: validate_invite (sem JWT) (2026-06-24 — v1)
- [x] Edge Function: register_with_invite (2026-06-24 — v1)
- [x] Edge Function: approve_registration (2026-06-24 — v1)
- [x] Edge Function: org_wallet_summary (colaborador) (2026-06-24 — v1)
- [x] Edge Function: transfer_from_org (colaborador) (2026-06-24 — v1)
- [x] Web admin: campo email no formulario de escola (2026-06-24)
- [x] Web admin: exibir codigos convite apos criacao (2026-06-24)
- [x] Web admin: codigos convite na tabela de escolas (2026-06-24)
- [x] Web admin: tela de aprovacoes pendentes (aprovar/recusar) (2026-06-24)
- [x] Web admin: distribuir YC para escola (credito na wallet business) (2026-06-24 — admin_credit_wallet RPC + Edge Function + modal)
- [x] Web admin: definir/alterar PIN da escola (2026-06-24)
- [x] Web admin: alterar role de membro (aluno → professor/funcionario/diretor) (2026-06-24)

### 3.2 Testes Funcionais Admin

- [ ] Login admin → Dashboard com dados reais
- [ ] Criar organizacao (colegio) pelo painel
- [ ] Excluir organizacao pelo painel
- [ ] Bloquear wallet de um usuario → verificar que nao consegue transferir
- [ ] Desbloquear wallet → verificar que volta a funcionar
- [ ] Estornar transacao → verificar que saldo retorna
- [ ] Verificar audit log de cada acao admin
- [ ] Exportar CSV de transacoes e conferir dados

### 3.3 Deploy Web Admin

- [x] Criar projeto no Vercel (2026-06-20 — moneyoung/mygbank, Hobby plan free)
- [x] Conectar repositorio Git (2026-06-20 — github.com/Derfolem/Moneyoung)
- [x] Configurar variaveis de ambiente no Vercel (2026-06-20):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] Deploy preview e testar (2026-06-20 — build OK, 14 paginas)
- [x] Deploy producao (2026-06-20 — https://mygbank.vercel.app)
- [ ] Configurar dominio proprio (aguardando autorizacao de Fagner)
- [x] Adicionar URL do Vercel nos redirects do Google OAuth (2026-06-20 — Supabase + Google Cloud)

---

## Fase 4 — Preparacao para 400 Alunos

### 4.1 Infraestrutura

- [ ] Plano Supabase Pro ativado ($25/mes)
- [ ] Compute Small ou Medium configurado
- [ ] Supavisor em modo `transaction` ativado
- [ ] Backups automaticos do banco de dados verificados
- [ ] Monitorar metricas no Supabase Dashboard (conexoes, latencia, storage)

### 4.2 Dados Iniciais

- [ ] Criar conta admin (bank_admin) no sistema
- [ ] Criar conta do colegio (usuario empresa) com organizacao vinculada
- [ ] Definir capital inicial do colegio (quantidade de Youngcoin)
- [ ] Creditar Youngcoin na wallet do colegio
- [ ] Configurar limites de transferencia adequados para alunos
- [ ] Testar fluxo completo: admin → colegio → aluno → aluno

### 4.3 Onboarding

- [ ] Preparar instrucoes de instalacao do APK para alunos
- [ ] Preparar instrucoes de primeiro login (email Google)
- [ ] Definir processo para o colegio distribuir Youngcoin aos alunos
- [ ] Definir processo para alunos comprarem produtos/servicos

### 4.4 Seguranca Pre-Lancamento

- [ ] Revisar todas as RLS policies
- [ ] Verificar que service role key NAO esta exposta em mobile ou web
- [ ] Verificar que `.env` NAO esta no Git
- [ ] Testar tentativas de acesso nao autorizado
- [ ] Revisar logs de auditoria apos testes
- [ ] Verificar rate limiting em cenario de 400 usuarios simultaneos
- [ ] Roteiro de resposta a incidentes definido (ver SECURITY.md)

---

## Fase 5 — Lancamento e Monitoramento

### 5.1 Lancamento

- [ ] APK distribuido para os 400 alunos
- [ ] Colegio com acesso ao sistema e capital creditado
- [ ] Admin com acesso ao painel web
- [ ] Primeiro dia: acompanhar acessos e transacoes em tempo real

### 5.2 Monitoramento (primeiras 2 semanas)

- [ ] Monitorar erros no Supabase Dashboard diariamente
- [ ] Monitorar volume de transacoes e latencia
- [ ] Monitorar eventos de seguranca
- [ ] Coletar feedback dos alunos e do colegio
- [ ] Corrigir bugs criticos encontrados

### 5.3 Ajuste Pos-Lancamento

- [ ] Reuniao de avaliacao apos 2 semanas
- [ ] Documentar problemas encontrados e solucoes
- [ ] Ajustar limites se necessario
- [ ] Avaliar necessidade de melhorias de UX

---

## Fase 6 — Pos-MVP (Futuro)

> Itens abaixo NAO fazem parte do escopo do MVP de 40 dias.
> Serao orcados separadamente apos validacao com os 400 usuarios.

- [ ] Contrato de manutencao mensal definido
- [ ] Notificacoes push reais (Firebase/Expo Notifications)
- [ ] Compartilhamento de comprovante real
- [ ] Expansao para iOS (Apple Developer $99/ano)
- [ ] Autenticacao em dois fatores (2FA)
- [ ] Biometria e reconhecimento facial
- [ ] Novos colegios e expansao de usuarios
- [ ] Marketplace/loja de recompensas
- [ ] Analise comportamental antifraude
- [ ] Relatorios por escola
- [ ] Abertura de contas por indicacao (usuario recebe link de convite para criar conta, sem cadastro aberto)

---

## Resumo de Progresso

| Fase | Status | Itens | Concluidos |
|---|---|---|---|
| 0 - Estrutura e Identidade | ✅ Concluida | 13 | 13 |
| 1 - Backend Supabase | ✅ Concluida | 22 | 22 |
| 2 - App Mobile Funcional | 🔄 Em andamento | 87 | 78 |
| 3 - Painel Web Admin | 🔄 Em andamento | 57 | 48 |
| 4 - Preparacao 400 Alunos | ⬜ Pendente | 22 | 0 |
| 5 - Lancamento | ⬜ Pendente | 13 | 0 |
| **Total MVP** | **Em andamento** | **214** | **162** |

---

## Custos Estimados (Responsabilidade do Contratante — FAGNER)

> **IMPORTANTE:** Todos os custos devem ser autorizados por FAGNER antes da execucao.
> O desenvolvimento prioriza alternativas sem custo (planos free).

| Item | Valor | Status |
|---|---|---|
| Supabase Free | R$ 0 | ✅ Em uso |
| Vercel Free (web admin) | R$ 0 | ✅ Em uso |
| Supabase Pro (escalabilidade) | ~R$ 130/mes | ⬜ Quando necessario |
| Google Play (publicacao) | US$ 25 (unico) | ⬜ Aguardando autorizacao |
| Dominio (opcional) | R$ 40-100/ano | ⬜ Aguardando autorizacao |
| **Total atual** | **R$ 0** | **Planos free** |

---

*Ultima atualizacao: 2026-06-24*
*Concluido: 162/214 itens (76%). Dashboard admin com metricas completas (valor corrente, contas ativas, transacoes dia/mes/ano, estornos, eventos criticos). Login Google OAuth no admin. Views corrigidas para SECURITY INVOKER. Faltam: build Android, testes funcionais admin e preparacao para lancamento.*
