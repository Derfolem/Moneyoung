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

## Paleta de cores

### Cores base (Mobile + Web Admin)

| Token | Cor | Uso |
|---|---|---|
| navyDeep | #0A1628 | Fundo principal de paginas |
| navyCard | #0F2035 | Legacy (substituido por glass no mobile v3) |
| navyLight | #162D4A | Fallback para inputs |
| gold | #D4A843 | Botoes primarios, acentos, logo, saldo |
| goldDark | #B8912F | Hover em botoes gold |
| goldLight | #E8C66A | Destaques secundarios |
| textPrimary | #FFFFFF | Texto principal |
| textSecondary | #8B9DC3 | Texto secundario, labels |
| success | #22C55E | Entradas de valor |
| danger | #EF4444 | Erros, saidas de valor |
| warning | #F59E0B | Alertas |

### Tokens glass (Mobile v3)

| Token | Cor | Uso |
|---|---|---|
| glass | rgba(15,32,53,0.45) | Fundo glassmorphism padrao |
| glassBorder | rgba(212,168,67,0.12) | Borda luminosa sutil |
| glassHighlight | rgba(255,255,255,0.05) | Linha highlight no topo |
| glassStrong | rgba(15,32,53,0.7) | Glass escuro (nav, toast, drawer) |

### Tokens glow/energia (Mobile v3)

| Token | Cor | Uso |
|---|---|---|
| glowGold | rgba(212,168,67,0.30) | Shadow/textShadow em saldos |
| glowGoldSoft | rgba(212,168,67,0.12) | Fundo de icone ativo |
| glowGoldStrong | rgba(232,198,106,0.50) | Glow intenso |
| glowSuccess | rgba(34,197,94,0.25) | Glow verde |
| glowDanger | rgba(239,68,68,0.25) | Glow vermelho |

### Tokens particulas (Mobile v3)

| Token | Cor | Uso |
|---|---|---|
| dustGold | rgba(212,168,67,0.6) | Particula dourada principal |
| dustGoldLight | rgba(232,198,106,0.4) | Particula dourada clara |
| dustWhite | rgba(255,255,255,0.3) | Particula branca |
| orbGold | rgba(212,168,67,0.03) | Orb dourado de fundo |
| orbBlue | rgba(30,58,95,0.25) | Orb azul de fundo |

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

## Componentes Web Admin

| Componente | Descricao |
|---|---|
| AdminShell | Sidebar navyCard com brand gold, links ativos com borda gold |
| Login | Painel dark com logo Josefin Sans, botao gold |
| DataTable | Tabela dark com headers navyLight |
| StatusPill | Badges semi-transparentes coloridos |

## Badges de tipo de usuario

| Tipo | Cor | Label |
|---|---|---|
| personal | Gold (#D4A843) | Aluno |
| business | Laranja (#FB923C) | Empresa |
| sub_business | Roxo (#C084FC) | Professor |
| system | Vermelho (#FCA5A5) | Administrador |

## Telas Mobile (v3)

1. **Login** — Screen com dust + orbs, TextLogo, inputs glass, goldLine com glow, link convite
2. **Invite** — Input glass grande (letras tracking 4), result card glass com glow
3. **Register** — Org badge glass, inputs glass, botao com glow
4. **Pending Approval** — Icone com glow dourado
5. **Home** — Orbs + GoldDust, GlassCard glow no saldo (textShadow), action circles glass, TransactionRows glass
6. **Org-Home** — Mesmo que Home + org badge GlassCard, role badge glow
7. **Transfer** — Valor com textShadow, inputs glass
8. **Transfer Confirm** — Card glass com blur, valor textShadow, divider glass
9. **Receipt** — Header glass escuro, card glass com shadow, titulo textShadow, dividers glass
10. **Pay** — Scanner com bordas arredondadas, inputs glass
11. **Receive** — QR card com glow shadow, chave textShadow, botao copiar com glow
12. **Statement** — Saldo textShadow, filter pills glass (ativo com glow), TransactionRows glass
13. **Notifications** — Cards glass, botao limpar glass com borda glow danger
14. **Profile** — Orbs, avatar com glow, info list em GlassCard, escola em GlassCard, sobre em GlassCard, botoes com borda glass
15. **Students** — Cards glass com botoes Transferir/Receber por aluno, PIN input glass, botao "Receber pagamento" gold no topo

## Navegacao Mobile (v3)

```
login -> invite -> register -> pending-approval -> home/org-home
login -> home (se ja tem sessao)
home/org-home -> transfer | pay | receive | statement | profile | notifications | students
transfer -> transfer-confirm -> receipt -> home
```

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
