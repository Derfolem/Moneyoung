# Mobile

## Estrutura

`apps/mobile` usa Expo Router, TypeScript, Supabase client, services e componentes reutilizaveis. Tema visual dark navy (#0A1628) + gold (#D4A843) com efeitos premium (glassmorphism, energia, poeira de ouro). Marca MoneYoung em Josefin Sans 700 Bold.

```
apps/mobile/
├── app/                    # Telas (Expo Router)
│   ├── _layout.tsx         # Root layout + auth guard + ToastHost + font loading
│   ├── login.tsx           # Login com Google OAuth
│   ├── invite.tsx          # Validar codigo convite
│   ├── register.tsx        # Cadastro pos-OAuth (dados pessoais)
│   ├── pending-approval.tsx # Aguardando aprovacao do banco
│   ├── home.tsx            # Dashboard aluno (saldo pessoal)
│   ├── org-home.tsx        # Dashboard colaborador (saldo da escola)
│   ├── transfer.tsx        # Transferir YC
│   ├── transfer-confirm.tsx # Confirmar transferencia
│   ├── receipt.tsx         # Comprovante
│   ├── pay.tsx             # Pagar via QR Code
│   ├── receive.tsx         # Receber (gerar QR Code)
│   ├── statement.tsx       # Extrato com filtros (universal: pessoal ou escola)
│   ├── notifications.tsx   # Notificacoes (universal) + "Limpar tudo"
│   ├── students.tsx        # Lista de alunos da escola (protegida por PIN)
│   └── profile.tsx         # Perfil universal (pessoal e colaborador)
├── src/
│   ├── components/
│   │   ├── BottomNav.tsx      # Navegacao inferior: personal (5 abas) ou staff (5 abas)
│   │   ├── Button.tsx         # Botao gold com glow pulsante animado
│   │   ├── Drawer.tsx         # Menu lateral glass (legacy)
│   │   ├── GlassCard.tsx      # Card glassmorphism (blur, borda luminosa, glow)
│   │   ├── GoldDust.tsx       # Particulas douradas animadas + AmbientOrbs
│   │   ├── HexLogo.tsx        # Logo 3D com glow
│   │   ├── PageHeader.tsx     # Header com botao voltar glass
│   │   ├── Screen.tsx         # Wrapper dark + AmbientOrbs + prop dust
│   │   ├── StateView.tsx      # Loading/error/empty states
│   │   ├── TextLogo.tsx       # Wordmark "MoneYoung" (Josefin Sans 700)
│   │   ├── Toast.tsx          # Toast glass (substitui Alert.alert)
│   │   └── TransactionRow.tsx # Card glass com nomes e badges de tipo
│   ├── services/
│   │   ├── auth.ts           # Google OAuth (signIn, signOut)
│   │   ├── moneyoung.ts      # Core service (transfer, pay, wallet, org, invite, translateError)
│   │   ├── supabase.ts       # Cliente Supabase (detectSessionInUrl dinamico, storage separado)
│   │   └── toast.ts          # Event emitter para toasts globais
│   └── theme/
│       └── colors.ts         # Paleta completa (navy, gold, glass, glow, dust, orb)
└── package.json
```

## Telas

### Fluxo de cadastro
- `/login` — Login Google OAuth + link "Codigo Convite"
- `/invite` — Digitar e validar codigo convite (AAA0000)
- `/register` — Formulario pos-OAuth (nome, nascimento DD/MM/AAAA com mascara, pais, estado, cidade, esporte, hobby, sobre)
- `/pending-approval` — Aguardando aprovacao do banco (refresh de status)

### Experiencia aluno (personal)
- `/home` — Dashboard com saldo, abas Enviar/Receber, acoes rapidas, ultimas transacoes. AmbientOrbs + GoldDust.
- `/transfer` → `/transfer-confirm` → `/receipt`
- `/pay` — Escanear QR Code ou digitar chave
- `/receive` — QR Code com young_key
- `/statement` — Extrato com filtros (tudo/entradas/saidas)
- `/notifications` — Entradas/saidas com nomes + "Limpar tudo"
- `/profile` — Dados pessoais, escola, chave, status, data abertura, nascimento DD/MM/AA

### Experiencia colaborador (sub_business)
- `/org-home` — Dashboard com saldo da escola, nome da escola, role, AmbientOrbs + GoldDust
- `/students` — Lista de alunos com saldo (protegida por PIN) + botoes Transferir/Receber por aluno + botao "Receber pagamento" no topo
- `/transfer` — Aceita parametro `to` para pre-preencher chave (usado pela tela alunos)
- `/transfer-confirm` — Detecta account_type: colaborador usa transferFromOrg, pessoal usa transferMoneyoung
- `/receive` — Busca young_key direto do profile (funciona para colaboradores sem wallet pessoal)
- Mesmas telas de statement, notifications, profile (adaptadas)

## Navegacao

### BottomNav Personal (5 abas)
Inicio (`/home`) | Transferir (`/transfer`) | Pagar (`/pay`) | Extrato (`/statement`) | Perfil (`/profile`)

### BottomNav Staff (5 abas)
Inicio (`/org-home`) | Transferir (`/transfer`) | Receber (`/receive`) | Alunos (`/students`) | Perfil (`/profile`)

Aba ativa: icone e label em gold com linha indicadora dourada no topo + fundo glow suave.
Barra: fundo glass com blur, borda luminosa sutil.

## Sistema Visual Premium

### Glassmorphism
Cards e superficies usam `GlassCard.tsx` com:
- Fundo semi-transparente: `rgba(15,32,53,0.45)`
- Blur CSS: `backdrop-filter: blur(16px)` (funciona no Expo Web)
- Borda luminosa: `rgba(212,168,67,0.12)`
- Linha highlight no topo (1px branco 5% opacidade)
- Opcao `glow`: shadow dourada para cards de destaque (ex: saldo)

### Energia (Glow/Pulse)
- Botoes primarios: shadow dourada que pulsa (Animated API, ciclo 3.6s)
- Valores de saldo: `textShadowColor` dourado com radius 12
- Avatar do usuario: shadow glow dourada
- Linha ativa do BottomNav: shadow dourada

### Poeira de Ouro (GoldDust)
- 14 particulas animadas (3 cores: dustGold, dustGoldLight, dustWhite)
- Flutuam para cima com drift horizontal sinusoidal
- Fade in/out suave em loop continuo
- Usado na tela de login e home pages

### Orbs Ambientais (AmbientOrbs)
- 3 circulos grandes posicionados fora da tela (top-right, bottom-left, center-right)
- Cores: orbGold (dourado 3% opacidade) e orbBlue (azul 25% opacidade)
- Criam profundidade e atmosfera em todas as telas via `Screen.tsx`

## Paleta (theme/colors.ts)

| Token | Cor | Uso |
|---|---|---|
| `navyDeep` | `#0A1628` | Fundo principal (Screen) |
| `navyCard` | `#0F2035` | Legacy (substituido por glass) |
| `navyLight` | `#162D4A` | Fallback para inputs |
| `gold` | `#D4A843` | Acentos, botoes, BottomNav ativo |
| `goldLight` | `#E8C66A` | Destaques |
| `textPrimary` | `#FFFFFF` | Texto principal |
| `textSecondary` | `#8B9DC3` | Texto secundario |
| `glass` | `rgba(15,32,53,0.45)` | Fundo glassmorphism |
| `glassBorder` | `rgba(212,168,67,0.12)` | Borda luminosa glass |
| `glassHighlight` | `rgba(255,255,255,0.05)` | Highlight topo card |
| `glassStrong` | `rgba(15,32,53,0.7)` | Glass escuro (nav, toast) |
| `glowGold` | `rgba(212,168,67,0.30)` | Glow em shadows/text |
| `glowGoldSoft` | `rgba(212,168,67,0.12)` | Glow suave (icon bg) |
| `dustGold` | `rgba(212,168,67,0.6)` | Particula dourada |
| `dustGoldLight` | `rgba(232,198,106,0.4)` | Particula clara |
| `dustWhite` | `rgba(255,255,255,0.3)` | Particula branca |
| `orbGold` | `rgba(212,168,67,0.03)` | Orb dourado |
| `orbBlue` | `rgba(30,58,95,0.25)` | Orb azul |

## Componentes

### GlassCard
Card reutilizavel com efeito glassmorphism. Props: `intensity` (soft/medium/strong), `glow` (shadow dourada), `noPadding`, `style`. Usado em balance cards, profile info, org badge, notificacoes.

### GoldDust + AmbientOrbs
Componente de particulas animadas (14 dots) + 3 orbs de fundo. Exportados do mesmo arquivo. GoldDust usa Animated API com loops independentes por particula.

### TextLogo
Wordmark "MoneYoung" em Josefin Sans 700 Bold. Props: `size` (default 28), `color` (default branco).

### BottomNav
Barra de navegacao inferior glass. Prop `staff` alterna entre itens personal e staff. Icone ativo com fundo glow suave.

### Button
Botao com glow pulsante animado no tone primary. Secondary usa fundo glass com blur. Tones: primary, secondary, danger, ghost.

### TransactionRow
Card glass com nome do participante, badge de tipo, chave, valor colorido (verde=entrada, vermelho=saida).

### Toast (ToastHost)
Toast glass escuro com blur forte. Montado no `_layout.tsx`. Suporta success/error/info.

### Screen
Wrapper com fundo navyDeep, AmbientOrbs automaticos, prop `dust` para habilitar GoldDust.

## Servicos

### auth.ts
- `signInWithGoogle()` — OAuth redirect (web) ou popup (nativo)
- `signOut()` — encerra sessao
- `hasActiveSession()` — verifica sessao ativa

### moneyoung.ts
- `ensureProfile()` — cria perfil + wallet no primeiro login
- `getWalletSummary()` — saldo, perfil e transacoes (pessoal)
- `getOrgWalletSummary()` — saldo, transacoes e membros (escola)
- `transferMoneyoung(payload)` — transferir YC
- `payMoneyoung(payload)` — pagar via QR Code
- `validateInviteCode(code)` — validar codigo convite
- `registerWithInvite(data)` — cadastro via convite
- `requestCancellation()` — solicitar cancelamento de conta
- `invoke(name, body)` — chama Edge Function via fetch direto
- `translateError(raw)` — traduz erros para portugues

### supabase.ts
Cliente Supabase com:
- `detectSessionInUrl: isWeb` — true na web para processar callback OAuth, false no nativo
- Storage separado: `localStorage` (web) / `SecureStore` (nativo)
- Header `x-moneyoung-client` para identificar plataforma

### toast.ts
- `toast.success/error/info(title, message?)`
- `toast.subscribe(fn)` — listener para ToastHost

## Fonte e Logo

Marca "MoneYoung" em Josefin Sans 700 Bold, carregada via `@expo-google-fonts/josefin-sans` e `expo-font` no `_layout.tsx`. `SplashScreen.preventAutoHideAsync()` mantem splash ate fonte carregar.

## Fluxo OAuth (Web)

1. Usuario clica "Entrar" → `signInWithGoogle()` redireciona para Google
2. Google retorna para `/login` com hash fragment contendo tokens
3. `detectSessionInUrl: true` permite Supabase processar o callback
4. `onAuthStateChange` detecta sessao → `handleSession()` rota para home ou register
5. Se ha convite pendente em localStorage → redireciona para `/register`
6. Apos cadastro → `/pending-approval` ate banco aprovar

## Rodar local

```bash
cd MYGbank
npm install
npm run dev:mobile:web
```

Abrir `http://localhost:8081`. O script carrega `.env` da raiz via `dotenv`.

IMPORTANTE: usar `npm run dev:mobile:web` da raiz do monorepo (nao `npx expo start` direto).

## Android

```bash
npm run build:android:preview
```

Profile `preview` gera APK.

## Variaveis

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EAS_PROJECT_ID`
