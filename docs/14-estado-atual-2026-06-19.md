# Estado Atual — 2026-06-19

## Progresso

74/108 itens do checklist MVP concluidos (69%).

## O que funciona

### Backend (Supabase)
- Projeto Supabase ativo (regiao South America)
- 3 migrations aplicadas (schema core, hardening, tipos de usuario)
- 8 tabelas com RLS + 1 view enriquecida
- 7 Edge Functions deployadas (v2+, todas ACTIVE)
- admin_dashboard_summary v3 (transacoes enriquecidas)
- Google OAuth configurado e funcionando
- 4 tipos de conta: personal, business, sub_business, system
- Chaves com prefixo: @ALN-, @EMP-, @SUBEMP-, @ADM-
- Limites de transferencia por tipo de conta
- RLS permite bank_admin ler todas as tabelas

### Mobile (Expo Web)
- Login Google OAuth real (redirect na web)
- Profile + wallet criados automaticamente no primeiro login
- Transferencia real entre contas com ledger
- Pagamento via chave manual (camera indisponivel na web)
- Recebimento via QR Code com young_key real
- Extrato com filtros (tudo/entradas/saidas) e nomes dos participantes
- Notificacoes reais com entradas, saidas, nomes e badges de tipo
- Comprovante com dados reais (origem, destino, valor, data)
- Toast global para feedback de sucesso/erro/info
- Mensagens de erro traduzidas para portugues
- Badges de tipo de usuario (Aluno, Empresa, Professor, Admin)

### Web Admin (Next.js)
- Login admin via Google OAuth
- Dashboard com metricas reais e transacoes enriquecidas
- Listagem de contas com busca, filtros e badges de tipo
- Listagem de wallets com busca, filtros e bloqueio/desbloqueio
- Listagem de transacoes com filtros e nomes dos participantes
- Detalhe de transacao com nomes, chaves, badges e estorno
- Gerenciamento de organizacoes (criar escola, vincular usuario)
- Auditoria completa com filtros e export CSV
- Eventos de seguranca com filtro por severidade
- Configuracao de limites por tipo de conta com badges
- Exportacao CSV (transacoes e auditoria)
- invokeFunction reescrita com fetch direto (erros reais)

### Usuarios de teste
- Fred Melo (melfredfred25@gmail.com) — @ADM-fredmelo2238 (bank_admin)
- Frederic Melo (agentcodi01@gmail.com) — @agentcodi012430 (common_user)

## O que falta

### Fase 2 (4 itens restantes)
- Build Android: EAS, APK, teste em dispositivo fisico

### Fase 3 (8 itens restantes)
- Testes funcionais do painel admin (login, organizacao, bloqueio, estorno, CSV)
- Deploy web admin no Vercel

### Fase 4 (14 itens)
- Preparacao para 400 alunos

### Fase 5 (8 itens)
- Lancamento e monitoramento

## Documentacao

14 documentos tecnicos atualizados:
- 00: Checklist MVP (fonte da verdade do progresso)
- 01: Visao geral (atualizado com tipos de conta)
- 02: Arquitetura (atualizado com view e toast)
- 03: Banco de dados (atualizado com sub_business, view, RPCs)
- 04: Seguranca (atualizado com limites por tipo)
- 05: Mobile (atualizado com toast, nomes, badges)
- 06: Web admin (atualizado com servicos, rotas, badges, permissoes)
- 07: Edge Functions (atualizado com transacoes enriquecidas)
- 08: Auditoria (atualizado com rastreamento por tipo)
- 09: Deploy (sem mudancas)
- 10: Roadmap (atualizado com status atual)
- 11: Estado 2026-06-16 (snapshot historico)
- 12: Redesign visual (atualizado com toast e badges)
- 13: Tipos de usuarios e relacionamentos (novo)
- 14: Estado 2026-06-19 (este documento)
