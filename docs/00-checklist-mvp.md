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

---

## Fase 1 — Backend Supabase (EM ANDAMENTO)

### 1.1 Projeto Supabase

- [ ] Criar projeto no Supabase Dashboard (escolher regiao South America)
- [ ] Anotar URL do projeto, anon key e service role key
- [ ] Preencher `.env` da raiz com todas as chaves:
  - `EXPO_PUBLIC_SUPABASE_URL`
  - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`

### 1.2 Banco de Dados

- [ ] Rodar migration `202606160001_youngcoin_core.sql` (schema, RLS, RPCs)
- [ ] Rodar migration `202606170001_youngcoin_backend_hardening.sql` (rate limiting, limites)
- [ ] Verificar que todas as tabelas foram criadas: profiles, organizations, organization_members, wallets, transactions, audit_logs, transfer_limits, security_events
- [ ] Verificar que RLS policies estao ativas em todas as tabelas
- [ ] Verificar que a RPC `transfer_youngcoin_tx` esta funcional
- [ ] Inserir limites iniciais na tabela `transfer_limits` (personal, business, system)

### 1.3 Autenticacao

- [ ] Configurar Google OAuth no Supabase Dashboard (Authentication > Providers > Google)
- [ ] Criar projeto no Google Cloud Console e obter Client ID + Secret
- [ ] Adicionar redirect URLs no Supabase:
  - `http://localhost:8081` (dev mobile)
  - `http://localhost:3000` (dev web admin)
  - `moneyoung://auth/callback` (mobile producao)
  - URL do Vercel (web admin producao)
- [ ] Testar login Google no mobile web (localhost:8081)
- [ ] Testar login Google no web admin (localhost:3000)

### 1.4 Edge Functions

- [ ] Deploy `create_profile_on_first_login`
- [ ] Deploy `transfer_youngcoin`
- [ ] Deploy `get_wallet_summary`
- [ ] Deploy `reverse_transaction`
- [ ] Deploy `block_wallet`
- [ ] Deploy `create_organization_account`
- [ ] Deploy `admin_dashboard_summary`
- [ ] Testar cada funcao manualmente via app ou curl

---

## Fase 2 — App Mobile Funcional

### 2.1 Conexao com Backend Real

- [ ] Login Google real funcionando (substituir modo demo)
- [ ] Profile criado automaticamente no primeiro login
- [ ] Wallet criada automaticamente junto com profile
- [ ] Tela Home mostrando saldo real do Supabase
- [ ] Transferencia real entre contas (debito + credito + ledger)
- [ ] Pagamento via QR Code real
- [ ] Recebimento via QR Code com young_key real
- [ ] Extrato mostrando transacoes reais do banco
- [ ] Perfil mostrando dados reais do usuario

### 2.2 Testes Funcionais Mobile

- [ ] Login → Home → ver saldo
- [ ] Transferir valor → confirmar → comprovante
- [ ] Pagar via QR Code
- [ ] Receber → gerar QR → outro usuario lê e paga
- [ ] Extrato com filtros (entradas/saidas)
- [ ] Tentar transferir mais que o saldo (deve falhar)
- [ ] Tentar transferir para chave inexistente (deve falhar)
- [ ] Testar rate limiting (varias transferencias rapidas)
- [ ] Testar idempotencia (mesma chave nao duplica)

### 2.3 Build Android

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

- [ ] Login admin via Google OAuth
- [ ] Dashboard com indicadores reais (contas, wallets, volume, transacoes/dia)
- [ ] Listagem de contas com busca e filtros
- [ ] Listagem de wallets com busca e filtros
- [ ] Listagem de transacoes com filtros (status, tipo, valor, wallet)
- [ ] Detalhe de transacao com audit logs
- [ ] Estorno de transacao funcionando
- [ ] Gerenciamento de organizacoes (criar, listar)
- [ ] Auditoria completa com filtros
- [ ] Eventos de seguranca com filtros
- [ ] Configuracao de limites por tipo de conta
- [ ] Exportacao CSV funcionando (transacoes e auditoria)

### 3.2 Testes Funcionais Admin

- [ ] Login admin → Dashboard com dados reais
- [ ] Criar organizacao (colegio) pelo painel
- [ ] Bloquear wallet de um usuario → verificar que nao consegue transferir
- [ ] Desbloquear wallet → verificar que volta a funcionar
- [ ] Estornar transacao → verificar que saldo retorna
- [ ] Verificar audit log de cada acao admin
- [ ] Exportar CSV de transacoes e conferir dados

### 3.3 Deploy Web Admin

- [ ] Criar projeto no Vercel
- [ ] Conectar repositorio Git
- [ ] Configurar variaveis de ambiente no Vercel:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Deploy preview e testar
- [ ] Deploy producao
- [ ] Configurar dominio proprio (opcional)
- [ ] Adicionar URL do Vercel nos redirects do Google OAuth

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

---

## Resumo de Progresso

| Fase | Status | Itens | Concluidos |
|---|---|---|---|
| 0 - Estrutura e Identidade | ✅ Concluida | 11 | 11 |
| 1 - Backend Supabase | ⬜ Pendente | 22 | 0 |
| 2 - App Mobile Funcional | ⬜ Pendente | 22 | 0 |
| 3 - Painel Web Admin | ⬜ Pendente | 20 | 0 |
| 4 - Preparacao 400 Alunos | ⬜ Pendente | 14 | 0 |
| 5 - Lancamento | ⬜ Pendente | 8 | 0 |
| **Total MVP** | **Em andamento** | **97** | **11** |

---

## Custos Estimados (Responsabilidade do Contratante)

| Item | Valor |
|---|---|
| Supabase Pro | ~R$ 130/mes |
| Vercel (web admin) | R$ 0-130/mes |
| Google Play (publicacao) | US$ 25 (unico) |
| Dominio (opcional) | R$ 40-100/ano |
| **Total mensal estimado** | **R$ 130-260/mes** |

---

*Ultima atualizacao: 2026-06-19*
*Proximo passo: Fase 1.1 — Criar projeto Supabase e configurar .env*
