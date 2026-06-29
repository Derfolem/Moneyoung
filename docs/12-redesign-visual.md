# Redesign Visual — Moneyoung (Mobile + Web Admin)

Data: 2026-06-17 (atualizado 2026-06-24)

## Objetivo

Interface premium fintech com identidade dark navy + gold, aplicada de forma consistente em mobile e web admin. O mobile v3 (2026-06-24) adiciona efeitos visuais avancados: glassmorphism, energia (glow/pulse), poeira de ouro (particulas animadas) e orbs ambientais.

## Evolucao

| Versao | Data | Mudancas |
|---|---|---|
| v1 | 2026-06-17 | Primeira versao dark navy + gold, HexLogo |
| v2 | 2026-06-23 | TextLogo MoneYoung, BottomNav 5 abas, paleta unificada, web admin dark |
| v3 | 2026-06-24 | Glassmorphism, energia, poeira de ouro, orbs ambientais |
| v4 | 2026-06-29 | Paleta do mockup (#00070D + #D99A26), ondas SVG decorativas, BottomNav YC central, TransactionRow em container, Button com brilho, login simplificado |

## Paleta de cores

### Cores base (Mobile + Web Admin) — v4

| Token | Cor v3 | Cor v4 | Uso |
|---|---|---|---|
| navyDeep | #0A1628 | **#00070D** | Fundo principal de paginas |
| navyInk | — | **#000306** | Base quase preta (novo) |
| navyCard | #0F2035 | **#03131D** | Cards e superficies |
| navyLight | #162D4A | **#061E2A** | Azul secundario |
| gold | #D4A843 | **#D99A26** | Botoes primarios, acentos, logo |
| goldDark | #B8912F | **#9F6508** | Hover em botoes gold |
| goldLight | #E8C66A | **#F3C65E** | Destaques, links |
| goldPale | — | **#FFE2A1** | Dourado palido (novo) |
| textPrimary | #FFFFFF | #FFFFFF | Texto principal |
| textSecondary | #8B9DC3 | **#A7B4C0** | Texto secundario, labels |
| textMuted | — | **#6F8594** | Texto atenuado (novo) |
| success | #22C55E | #22C55E | Entradas de valor |
| danger | #EF4444 | #EF4444 | Erros, saidas de valor |
| warning | #F59E0B | #F59E0B | Alertas |

### Tokens glass (Mobile v3/v4)

| Token | Cor v3 | Cor v4 |
|---|---|---|
| glass | rgba(15,32,53,0.45) | **rgba(3,19,29,0.76)** |
| glassBorder | rgba(212,168,67,0.12) | **rgba(243,198,94,0.18)** |
| glassHighlight | rgba(255,255,255,0.05) | **rgba(255,255,255,0.08)** |
| glassStrong | rgba(15,32,53,0.7) | **rgba(0,9,15,0.94)** |
| borderGold | rgba(212,168,67,0.3) | **rgba(217,154,38,0.42)** |
| input | — | **rgba(0,10,16,0.74)** (novo, fundo inputs/acoes) |

### Tokens glow/energia (Mobile v3/v4)

| Token | Cor v3 | Cor v4 |
|---|---|---|
| glowGold | rgba(212,168,67,0.30) | **rgba(217,154,38,0.34)** |
| glowGoldSoft | rgba(212,168,67,0.12) | **rgba(217,154,38,0.14)** |
| glowGoldStrong | rgba(232,198,106,0.50) | **rgba(243,198,94,0.52)** |
| glowSuccess | rgba(34,197,94,0.25) | rgba(34,197,94,0.25) |
| glowDanger | rgba(239,68,68,0.25) | rgba(239,68,68,0.25) |

### Tokens particulas (Mobile v3/v4)

| Token | Cor v3 | Cor v4 |
|---|---|---|
| dustGold | rgba(212,168,67,0.6) | **rgba(217,154,38,0.72)** |
| dustGoldLight | rgba(232,198,106,0.4) | **rgba(243,198,94,0.48)** |
| dustWhite | rgba(255,255,255,0.3) | rgba(255,255,255,0.3) |
| orbGold | rgba(212,168,67,0.03) | **rgba(217,154,38,0.08)** |
| orbBlue | rgba(30,58,95,0.25) | **rgba(4,38,54,0.18)** |

## Efeitos Visuais Premium (Mobile v3)

### 1. Glassmorphism

Cards e superficies com transparencia + blur, criando profundidade e sofisticacao:

- **GlassCard.tsx**: componente reutilizavel
  - Fundo: `rgba(15,32,53,0.45)` com `backdrop-filter: blur(16px)`
  - Borda: `rgba(212,168,67,0.12)` (1px)
  - Linha highlight: 1px branca 5% no topo
  - Prop `glow`: adiciona shadow dourada para cards de destaque
  - Prop `intensity`: soft/medium/strong
- Aplicado em: balance card, org badge, profile info, notifications, transaction rows, transfer confirm, receipt, invite result, register org badge

### 2. Energia (Glow/Pulse)

Elementos que "respiram" com luz dourada:

- **Button primary**: shadow dourada que pulsa (ciclo 3.6s via Animated API)
  - `shadowOpacity`: 0.15 → 0.45, `shadowRadius`: 8 → 22
- **Saldos**: `textShadowColor: glowGold`, `textShadowRadius: 12`
- **Avatar**: `shadowColor: gold`, `shadowOpacity: 0.35`, `shadowRadius: 10-20`
- **BottomNav ativo**: linha com shadow glow, icone com fundo glow suave
- **QR card**: shadow dourada
- **Botao copiar**: shadow dourada

### 3. Poeira de Ouro (GoldDust)

Particulas douradas animadas flutuando na tela:

- **14 particulas** com 3 cores alternadas (dustGold, dustGoldLight, dustWhite)
- Tamanhos: 1.5px a 3.5px
- Animacoes por particula (Animated API, `useNativeDriver: false`):
  - Opacity: 0 → 0.9 → 0.4 → 0 (fade in/out)
  - TranslateY: 0 → -60px (flutua para cima)
  - TranslateX: drift sinusoidal (±8-20px)
- Duracoes: 4000-8800ms por particula
- Delays escalonados para nao sincronizar
- Loop continuo, sem impacto perceptivel em performance
- Habilitado via prop `dust` em `Screen.tsx`
- Usado em: login, pode ser adicionado em qualquer tela

### 4. Orbs Ambientais (AmbientOrbs)

Circulos grandes semi-transparentes no fundo:

- 3 orbs fixos (sem animacao, leves):
  - Top-right: 300x300px, orbGold
  - Bottom-left: 250x250px, orbBlue
  - Center-right: 200x200px, orbGold
- Criam profundidade e atmosfera
- Automaticos em todas as telas via `Screen.tsx`

## Tipografia

- **Logo "MoneYoung"**: Josefin Sans Bold 700 (Google Fonts)
  - Mobile: `@expo-google-fonts/josefin-sans` com `SplashScreen`
  - Web Admin: Google Fonts CSS `@import`
- **Corpo**: Inter (web admin), system font (mobile)

## Componentes Mobile (v3)

| Componente | Efeito visual |
|---|---|
| Screen | AmbientOrbs automaticos, prop dust para GoldDust |
| GlassCard | Glassmorphism com blur, borda luminosa, opcao glow |
| GoldDust | 14 particulas douradas animadas |
| Button | Gold com glow pulsante animado (primary) |
| BottomNav | Barra glass com blur, linha glow ativa |
| TransactionRow | Card glass com blur |
| Toast | Glass escuro com blur forte |
| Drawer | Glass escuro com blur |
| PageHeader | Botao voltar glass |
| HexLogo | Shadow glow dourada |

## Componentes Web Admin (v4)

| Componente | Descricao |
|---|---|
| AdminShell | Sidebar `rgba(0,9,15,0.96)` com blur 18px, borda gold, shadow dark |
| Login | Painel dark com logo Josefin Sans, botao gold |
| DataTable | Tabela dark com headers `rgba(0,21,34,0.74)`, borda-gold |
| StatusPill | Badges semi-transparentes coloridos |
| Buttons | Gradiente gold-light → gold → gold-dark, hover translateY(-1px) |
| Cards | backdrop-filter blur, box-shadow dark 16px 36px |

## Badges de tipo de usuario

| Tipo | Cor | Label |
|---|---|---|
| personal | Gold (#D99A26) | Aluno |
| business | Laranja (#FB923C) | Empresa |
| sub_business | Roxo (#C084FC) | Professor |
| system | Vermelho (#FCA5A5) | Administrador |

## Telas Mobile (v4)

1. **Login** — Removidos campos email/senha/Microsoft. Titulo "Bem-vindo(a)!", botao Google social, link "Criar conta". Tagline "Empreendedorismo + Educacao Financeira"
2. **Invite** — Sem mudancas v4
3. **Register** — Sem mudancas v4
4. **Pending Approval** — Sem mudancas v4
5. **Home** — Header com avatar+greeting+notif dot; card saldo com "Ver extrato"; 2 acoes (Transferir+Receber); lista em GlassCard container; transacoes ordenadas por data
6. **Org-Home** — Idem Home + org badge; `maxWidth: 430`; lista em GlassCard container; transacoes ordenadas por data
7. **Transfer** — Atalhos +10/+50/+100/+200 adicionados
8. **Transfer Confirm** — Sem mudancas v4
9. **Receipt** — Sem mudancas v4
10. **Pay** — Sem mudancas v4
11. **Receive** — Icones em branco; `borderColor: borderGold` no QR card
12. **Statement** — Saldo em GlassCard; transacoes ordenadas por data
13. **Notifications** — Transacoes ordenadas por data (welcome por ultimo)
14. **Profile** — `maxWidth: 430`; icones com fundo `input`; botoes radius 12
15. **Students** — Sem mudancas v4

## Navegacao Mobile (v4)

```
login -> invite -> register -> pending-approval -> home/org-home
login -> home (se ja tem sessao)
home/org-home -> transfer | pay | receive | statement | profile | notifications | students
transfer -> transfer-confirm -> receipt -> home
```

### BottomNav (v4)

**Personal:** Inicio | Extrato | YC (central, /transfer) | QR Code (/receive) | Perfil
**Staff:** Inicio | Extrato | YC (central, /transfer) | QR Code (/receive) | Perfil
(Aba Alunos removida do staff em v4 — acessivel via quick actions em org-home)

## Como testar

### Mobile
```bash
cd ~/APPs/Fagner/MYGbank
npm install
npm run dev:mobile:web
```
Abrir http://localhost:8081.

### Web Admin
```bash
cd ~/APPs/Fagner/MYGbank
npm run dev:web
```
Abrir http://localhost:3000.
