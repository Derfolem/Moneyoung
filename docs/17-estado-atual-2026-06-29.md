# Estado Atual — 2026-06-29

## Progresso

196/235 itens do checklist MVP concluidos (83%).

## Sessao Codex (2026-06-29)

Redesign visual v4 completo alinhado ao mockup original do projeto, realizado pelo Codex (08:38–09:26 BRT). Nenhum commit foi criado durante a sessao — commits pendentes listados ao final.

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
- Valores glass/glow/dust/orb ajustados para a nova paleta

**Web Admin (`apps/web-admin/app/globals.css`):**
- Variaveis CSS espelhadas com a nova paleta
- Background do body com gradientes radiais e lineares discretos
- Sidebar com `rgba(0,9,15,0.96)` e `backdrop-filter: blur(18px)`
- Cards com `box-shadow: 0 16px 36px rgba(0,0,0,0.20)` e `backdrop-filter: blur(16px)`
- Tabelas: `border-gold` em vez de `border`, header mais escuro `rgba(0,21,34,0.74)`
- Inputs: fundo `rgba(0,10,16,0.74)` + borda gold
- Botoes: gradiente `(gold-light → gold → gold-dark)`, hover com `filter: brightness(1.08)` e `translateY(-1px)`
- Links da sidebar: `color: text-primary` (branco) no estado normal, link ativo com `box-shadow inset`

### Componentes Mobile

**GlassCard:**
- `borderRadius`: 20 → 16, `padding`: 20 → 18
- Adicionado `box-shadow` dark e glow mais intenso
- `glow`: shadow gold + `borderColor: borderGold` (mais visivel)

**Screen:**
- Content limitado a `maxWidth: 430` com `alignSelf: center`

**Button:**
- Cor do texto primary: `navyDeep` → `textPrimary` (branco)
- Borda `goldLight` adicionada
- Adicionado brilho interno no topo (`Animated.View` semibranco)
- `borderRadius`: 16 → 14, `fontWeight` text: 800 → 900

**PageHeader:**
- Botao voltar: background `glass` removido (ficou transparente)
- Titulo: `fontSize` 28 → 18

**TransactionRow:**
- Cada row era um card glass independente; agora e transparente com `borderBottomWidth: 1` (deve ficar dentro de container glass)

**GoldDust / AmbientOrbs:**
- Ondas SVG decorativas douradas adicionadas ao `AmbientOrbs` (4 paths, opacidade baixa)
- Orbs reposicionados e com tamanhos ajustados

### Telas Mobile

**Login:**
- Campos email/senha REMOVIDOS
- Opcao Microsoft REMOVIDA
- Adicionado titulo "Bem-vindo(a)!" e subtitulo "Faca login para continuar"
- Botao Google mantido com estilo social (glass + icone)
- Tagline alterada para "Empreendedorismo + Educacao Financeira"
- Link "Codigo Convite" renomeado para "Ainda nao tem conta? Criar conta"

**Home (aluno):**
- Header: TextLogo removido; agora mostra avatar circulo dourado + "Ola, [primeiro nome]!" + "Aluno" abaixo + sino no lado direito
- Sino: icone sem background, com ponto vermelho de notificacao (sempre visivel)
- Card de saldo: removidas as abas "Enviar"/"Receber" internas; adicionado link "Ver extrato" no canto superior direito; valor em branco (nao dourado)
- Acoes rapidas: reduzidas de 4 para 2 — Transferir e Receber apenas
- Acoes: circulos com `borderRadius: 14` (quadrados arredondados) em vez de circulos
- Key duplicada corrigida: key dos atalhos e `label-route` em vez de apenas `route`
- Transacoes: ordenadas por `created_at` decrescente antes de exibir
- Lista de transacoes: agrupada dentro de um GlassCard container (rows sem border propria)

**Org-home (colaborador):**
- Identicas mudancas de header e card de saldo do home do aluno
- Largura limitada a `maxWidth: 430`
- Transacoes: ordenadas por `created_at` decrescente
- Badge de escola: com `flex: 1` no nome e `fontWeight: 900`

**Transfer:**
- Atalhos de valor adicionados: `+10`, `+50`, `+100`, `+200` (preenchem o campo de valor)
- Input de valor: alinhamento `left`, `borderRadius: 10`, fundo `input` (mais escuro)
- Valor display em branco (nao dourado)

**Receive:**
- Cor do icone de copia e texto "Copiar chave" alterados para branco
- QR card: `borderColor: borderGold` (mais visivel que `glassBorder`)
- Chave MoneYoung: fonte reduzida (18 → 14) e cor em branco

**Statement:**
- Saldo encapsulado em `GlassCard` com `glow` (antes era view simples)
- Transacoes ordenadas por `created_at` decrescente antes e depois de aplicar filtro
- Pills de filtro: `borderRadius: 10` (eram 20), fundo `input`, texto ativo em branco

**Notifications:**
- Adicionado campo `createdAt` opcional em `Notif`
- Transacoes ordenadas por `created_at` decrescente antes de converter em notificacoes
- Lista final reordenada: a notificacao de boas-vindas ("1970-01-01") vai para o fundo
- Funciona para ambos os tipos de conta

**Profile:**
- Largura limitada a `maxWidth: 430`
- Chave MoneYoung: cor `goldLight` (mais clara)
- Icones de item: background `input` (era `glowGoldSoft`)
- Botoes com `borderRadius: 12` (era 16)

### BottomNav (mudanca estrutural)

**Antes — Personal:** Inicio | Transferir | Pagar | Extrato | Perfil

**Depois — Personal:** Inicio | Extrato | **YC** (central dourado elevado, abre /transfer) | QR Code (abre /receive) | Perfil

**Antes — Staff:** Inicio | Transferir | Receber | Alunos | Perfil

**Depois — Staff:** Inicio | Extrato | **YC** (central dourado elevado, abre /transfer) | QR Code (abre /receive) | Perfil

Mudancas tecnicas:
- Botao central (featured): circulo dourado 58x58, elevado -26px acima da barra, label oculta, texto "YC" em navy
- Label do botao central alterada de "$Y"/"Young" para "YC" (sem label visivel)
- Aba Alunos REMOVIDA do staff (acessivel apenas via quick actions em /org-home)
- BottomNav com `maxWidth: 430` e `shadowColor: #000` na barra

## Estado do Git

Todos os 17 arquivos modificados estao pendentes de commit (nenhum commit criado pelo Codex):

```
apps/mobile/app/home.tsx
apps/mobile/app/login.tsx
apps/mobile/app/notifications.tsx
apps/mobile/app/org-home.tsx
apps/mobile/app/profile.tsx
apps/mobile/app/receive.tsx
apps/mobile/app/statement.tsx
apps/mobile/app/transfer.tsx
apps/mobile/src/components/BottomNav.tsx
apps/mobile/src/components/Button.tsx
apps/mobile/src/components/GlassCard.tsx
apps/mobile/src/components/GoldDust.tsx
apps/mobile/src/components/PageHeader.tsx
apps/mobile/src/components/Screen.tsx
apps/mobile/src/components/TransactionRow.tsx
apps/mobile/src/theme/colors.ts
apps/web-admin/app/globals.css
```

Commits a criar (ver codex.md para mensagens sugeridas).

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
- UI v4: paleta do mockup (#00070D + #D99A26), glassmorphism refinado, ondas decorativas
- Login simplificado: apenas Google OAuth + criar conta
- Header com avatar + saudacao inline + ponto de notificacao
- Card de saldo com link "Ver extrato" direto
- Atalhos de valor na transferencia (+10, +50, +100, +200)
- BottomNav com botao YC central dourado elevado
- Transacoes ordenadas por data (mais recente primeiro) em todas as telas
- Largura mobile limitada a 430px em todas as telas
- Todas as funcionalidades do estado 2026-06-24 mantidas

### Web Admin (Next.js)
- Tema dark navy-black + gold alinhado ao mockup
- Gradientes, blur, box-shadow em cards e sidebar
- Botoes com gradiente gold e efeito hover
- Deploy Vercel producao (https://mygbank.vercel.app)

## O que falta

### Fase 2 (9 itens restantes)
- Build Android: EAS, APK, teste em dispositivo, Google Play

### Fase 3 (3 itens restantes)
- Excluir organizacao via browser
- Exportar CSV via browser
- Dominio proprio (aguardando autorizacao de Fagner)

### Fase 4 (15 itens restantes)
- Leaked Password Protection (requer plano Pro $25/mes)
- Infraestrutura (5 itens): Supabase Pro, compute, backups
- Dados iniciais (6 itens): contas, creditos, limites
- Onboarding (4 itens): instrucoes, processos

### Fase 5 (13 itens)
- Lancamento e monitoramento

## Documentacao

17 documentos tecnicos:
- 00: Checklist MVP (196/235, 83%)
- 01: Visao geral
- 02: Arquitetura
- 03: Banco de dados
- 04: Seguranca
- 05: Mobile (atualizado: redesign v4, telas, BottomNav)
- 06: Web admin
- 07: Edge Functions
- 08: Auditoria
- 09: Deploy
- 10: Roadmap
- 11: Estado 2026-06-16 (snapshot historico)
- 12: Redesign visual (atualizado: v4 adicionado)
- 13: Tipos de usuarios e relacionamentos
- 14: Estado 2026-06-19 (snapshot historico)
- 15: Estado 2026-06-23 (snapshot historico)
- 16: Estado 2026-06-24 (snapshot historico)
- 17: Estado 2026-06-29 (este documento)
