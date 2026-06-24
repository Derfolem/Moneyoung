# Estado Atual — 2026-06-23 (snapshot historico)

> **Nota:** Este documento e um snapshot historico. Para o estado atual, veja `docs/16-estado-atual-2026-06-24.md`.

## Progresso

82/110 itens do checklist MVP concluidos (75%).

## Mudancas desde 2026-06-19

### Identidade Visual (2026-06-23)
- Redesign completo mobile e web admin baseado nos mockups oficiais
- Marca: wordmark "MoneYoung" em Josefin Sans 700 Bold (substituiu HexLogo)
- Paleta: dark navy (#0A1628) + gold (#D4A843) em ambas as plataformas
- Mobile: BottomNav com 5 abas substituiu Drawer, todas as telas reescritas
- Web admin: CSS custom properties, sidebar com marca gold, tema dark completo
- Fonte Josefin Sans carregada via Google Fonts (mobile e web)

### Organizacoes (2026-06-20)
- Escolas com campos em portugues
- Excluir escola pelo painel admin
- Vincular/desvincular membros por chave Moneyoung
- Correcao de recursao RLS em organization_members

### Deploy (2026-06-20)
- Web admin deployado no Vercel: https://mygbank.vercel.app
- Build OK com 14 paginas

## O que funciona

### Backend (Supabase)
- Projeto Supabase ativo (regiao South America)
- 3+ migrations aplicadas (schema core, hardening, tipos de usuario, RLS fixes)
- 8 tabelas com RLS + 1 view enriquecida
- 7 Edge Functions deployadas (todas ACTIVE)
- Google OAuth configurado e funcionando
- 4 tipos de conta: personal, business, sub_business, system
- Chaves com prefixo: @ALN-, @EMP-, @SUBEMP-, @ADM-
- Limites de transferencia por tipo de conta

### Mobile (Expo)
- Identidade visual dark navy + gold com marca MoneYoung (Josefin Sans 700)
- BottomNav com 5 abas (Inicio, Transferir, Pagar, Extrato, Perfil)
- Login Google OAuth real
- Profile + wallet criados automaticamente no primeiro login
- Transferencia real entre contas com ledger
- Pagamento via chave manual
- Recebimento via QR Code com young_key real
- Extrato com filtros e nomes dos participantes
- Notificacoes reais com entradas, saidas, nomes e badges
- Comprovante com dados reais e watermark TextLogo
- Toast global para feedback (success/error/info)
- Mensagens de erro traduzidas para portugues

### Web Admin (Next.js)
- Identidade visual dark navy + gold com marca MoneYoung (Josefin Sans + Inter)
- CSS custom properties para toda a paleta
- Sidebar com marca gold, links ativos com borda gold, avatar do usuario
- Login admin via Google OAuth
- Dashboard com metricas reais e transacoes enriquecidas
- Listagem de contas, wallets, transacoes com filtros e badges
- Detalhe de transacao com nomes, chaves e estorno
- Gerenciamento de organizacoes (criar, excluir, vincular/desvincular membros)
- Auditoria completa com filtros e export CSV
- Eventos de seguranca com filtro por severidade
- Configuracao de limites por tipo de conta
- Deploy Vercel producao (https://mygbank.vercel.app)

### Usuarios de teste
- Fred Melo (melfredfred25@gmail.com) — @ADM-fredmelo2238 (bank_admin)
- Frederic Melo (agentcodi01@gmail.com) — @agentcodi012430 (common_user)

## O que falta

### Fase 2 (4 itens restantes)
- Build Android: EAS, APK, teste em dispositivo fisico, Google Play

### Fase 3 (2 itens restantes)
- Testes funcionais do painel admin (7 itens)
- Dominio proprio (aguardando autorizacao de Fagner)

### Fase 4 (14 itens)
- Preparacao para 400 alunos (Supabase Pro, dados iniciais, onboarding, seguranca)

### Fase 5 (8 itens)
- Lancamento e monitoramento

## Documentacao

15 documentos tecnicos:
- 00: Checklist MVP (82/110, 75%)
- 01: Visao geral (atualizado com identidade visual)
- 02: Arquitetura (atualizado com identidade visual)
- 03: Banco de dados
- 04: Seguranca
- 05: Mobile (atualizado com TextLogo, BottomNav, paleta, Josefin Sans)
- 06: Web admin (atualizado com tema dark navy+gold, CSS variables)
- 07: Edge Functions
- 08: Auditoria
- 09: Deploy
- 10: Roadmap
- 11: Estado 2026-06-16 (snapshot historico)
- 12: Redesign visual (novo — documentacao completa da identidade)
- 13: Tipos de usuarios e relacionamentos
- 14: Estado 2026-06-19 (snapshot historico)
- 15: Estado 2026-06-23 (este documento)
