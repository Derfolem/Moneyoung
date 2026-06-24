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

## Telas do App

### Login (`/login`)
Tela inicial do aplicativo. Exibe a marca MoneYoung com tagline "Sua carteira digital educacional" e particulas douradas animadas ao fundo.

- **Botao "Entrar"** — inicia o login via Google OAuth. Apos autenticar, o sistema verifica se o usuario ja tem perfil. Se tiver, redireciona para a home adequada (aluno ou colaborador). Se nao tiver perfil, exige codigo convite.
- **Link "Codigo Convite"** — navega para a tela de validacao de codigo convite. Usado por novos usuarios que receberam um codigo da escola.
- Campos email/senha estao visiveis mas desabilitados (reservados para implementacao futura).

Apos login, o redirecionamento depende do tipo de conta:
- `personal` → `/home` (dashboard do aluno)
- `sub_business` → `/org-home` (dashboard do colaborador)
- `status: pending` → `/pending-approval` (aguardando aprovacao)

### Codigo Convite (`/invite`)
Tela para validar o codigo de convite recebido da escola. O usuario digita o codigo no formato AAA0000 (3 letras + 4 numeros, ex: ALS3443).

- **Campo de codigo** — aceita ate 7 caracteres, converte para maiusculas automaticamente.
- **Botao "Validar Codigo"** — envia para a Edge Function `validate_invite`. Se valido, mostra o nome da escola e o tipo de cadastro (Aluno ou Colaborador).
- **Botao "Continuar com Google"** — aparece apos validacao. Inicia o login OAuth e navega para o formulario de cadastro.

Se o codigo for invalido ou a escola estiver inativa, exibe mensagem de erro.

### Cadastro (`/register`)
Formulario de cadastro apos o login Google, para novos usuarios com codigo de convite. Exibe um badge com o nome da escola e o tipo de cadastro (Aluno/Colaborador).

Campos do formulario:
- **Nome completo** * — obrigatorio, minimo 2 caracteres.
- **Data de nascimento** * — obrigatorio, formato DD/MM/AAAA com mascara automatica. Calcula e exibe a idade ao lado.
- **Pais** — pre-preenchido com "Brasil".
- **Estado** e **Cidade** — opcionais.
- **Esporte favorito** — opcional.
- **Hobby** — opcional.
- **Sobre voce** — opcional, maximo 200 caracteres com contador.

**Botao "Criar Conta"** — envia os dados para a Edge Function `register_with_invite`. Cria o perfil com status `pending` e redireciona para a tela de aprovacao. Se o usuario ja tiver conta, exibe mensagem e redireciona para o login.

### Aguardando Aprovacao (`/pending-approval`)
Tela exibida apos o cadastro via convite, enquanto o banco nao aprova o usuario.

- Icone de ampulheta dourado e mensagem "Cadastro Enviado!".
- **Botao "Verificar Status"** — consulta o status do perfil no banco. Se aprovado, exibe toast de sucesso e redireciona para `/home`. Se recusado, exibe mensagem de erro. Se ainda pendente, informa que esta em analise.
- **Botao "Voltar ao Login"** — retorna para a tela de login.

### Home do Aluno (`/home`)
Dashboard principal para usuarios com conta pessoal (alunos). Exibe particulas douradas e orbs ambientais ao fundo.

- **Header** — logo MoneYoung, sino de notificacoes (navega para `/notifications`) e avatar do usuario (navega para `/profile`).
- **Saudacao** — "Bom dia/Boa tarde/Boa noite, [nome]" com horario dinamico.
- **Card de Saldo** — card em vidro com glow dourado mostrando "Saldo disponivel" em YC (Youngcoin), com a chave MoneYoung abaixo. Botoes "Enviar" e "Receber" no rodape do card.
- **Acoes rapidas** — 4 botoes circulares: Transferir, Pagar, Receber, Extrato.
- **Ultimas transacoes** — lista das 5 transacoes mais recentes com link "Ver tudo" para o extrato completo.
- **Pull-to-refresh** — puxar para baixo atualiza saldo e transacoes.

Barra de navegacao inferior (BottomNav): Inicio | Transferir | Pagar | Extrato | Perfil.

### Home do Colaborador (`/org-home`)
Dashboard para usuarios com conta `sub_business` (professores, funcionarios, diretores). Mostra o saldo da conta da escola, nao da conta pessoal.

- **Header** — identico ao do aluno (logo, notificacoes, avatar).
- **Badge da escola** — card em vidro com icone de escola, nome da organizacao e role do colaborador (Professor, Funcionario, Diretor).
- **Card de Saldo** — mostra "Saldo da Escola" em YC. Botoes "Enviar" e "Receber" transferem da conta da escola.
- **Acoes rapidas** — 4 botoes: Transferir, Receber, Alunos, Extrato.
- **Ultimas transacoes** — transacoes da conta da escola.

Barra de navegacao inferior (BottomNav staff): Inicio | Transferir | Receber | Alunos | Perfil.

### Transferir (`/transfer`)
Tela para iniciar uma transferencia de Youngcoins. Usada tanto por alunos (da conta pessoal) quanto por colaboradores (da conta da escola).

- **Display do valor** — mostra o valor digitado em tamanho grande com sufixo "YC" e glow dourado.
- **Campo de valor** — input numerico para digitar o valor da transferencia.
- **Campo "Chave MoneYoung"** — chave de destino (ex: @ALN-joao1234). Pode vir pre-preenchida quando o colaborador clica "Transferir" na tela de alunos.
- **Campo "Descricao"** — opcional, texto livre para descrever a transferencia.
- **Botao "Transferir"** — valida os campos (chave obrigatoria, valor maior que zero) e navega para a tela de confirmacao.

Aceita parametro `to` na URL para pre-preencher a chave de destino.

### Confirmar Transferencia (`/transfer-confirm`)
Tela de revisao antes de confirmar a transferencia. Exibe um card em vidro com os detalhes:

- Logo MoneYoung no topo.
- **Valor** — em destaque com glow dourado.
- **Destinatario** — chave MoneYoung de quem vai receber.
- **Descricao** — texto informado ou "Sem descricao".
- **Botao "Confirmar"** — executa a transferencia. Detecta automaticamente o tipo de conta: colaboradores usam `transferFromOrg` (transfere da wallet da escola), alunos usam `transferMoneyoung` (transfere da wallet pessoal). Apos sucesso, navega para o comprovante.
- **Botao "Cancelar"** — volta para a tela anterior.

### Comprovante (`/receipt`)
Tela de comprovante exibida apos uma transferencia bem-sucedida. Design premium com header glass e card sobreposto.

Informacoes exibidas:
- **Valor** — quanto foi transferido.
- **Data** — data e hora da transacao no formato brasileiro.
- **Origem** — chave MoneYoung de quem enviou.
- **Destino** — chave MoneYoung de quem recebeu.
- **Descricao** — texto da transferencia.
- **Status** — "Concluida" com indicador verde.

Acoes:
- **Botao "Compartilhar"** — funcionalidade prevista para proxima versao (exibe toast informativo).
- **Botao "Voltar ao inicio"** — retorna para a home.

### Pagar (`/pay`)
Tela para realizar pagamentos via QR Code ou chave manual.

- **Scanner de QR Code** — se a camera estiver disponivel e com permissao, exibe o scanner em tela cheia com moldura dourada e texto "Aponte para o QR Code MoneYoung". Ao ler um QR, preenche automaticamente a chave.
- **Modo manual** — se a camera estiver indisponivel (ex: web), exibe campos para digitar a chave e o valor manualmente.
- **Campo "Chave MoneYoung"** — chave do destinatario (preenchida automaticamente pelo QR ou digitada).
- **Campo "Valor"** — valor do pagamento.
- **Botao "Confirmar pagamento"** — executa o pagamento com descricao automatica "Pagamento via QR Code".
- **Botao "Ler outro QR Code"** — volta para o scanner (disponivel apos uma leitura).

### Receber (`/receive`)
Tela para exibir o QR Code do usuario, permitindo que outros paguem para ele.

- **QR Code** — gerado automaticamente a partir da chave MoneYoung do usuario. Card branco com logo MoneYoung, borda dourada e shadow com glow.
- **Chave MoneYoung** — exibida abaixo do QR Code em dourado com glow.
- **Botao "Copiar chave"** — copia a chave para a area de transferencia para compartilhar por texto.

Funciona tanto para alunos (chave pessoal) quanto para colaboradores (chave do profile, que identifica a escola).

### Extrato (`/statement`)
Tela com o historico completo de transacoes. Adapta-se automaticamente ao tipo de conta: alunos veem transacoes pessoais, colaboradores veem transacoes da escola.

- **Saldo atual** — valor em destaque no topo com glow dourado.
- **Filtros** — 3 botoes estilo "pill" em vidro: "Tudo" (todas as transacoes), "Entradas" (recebimentos) e "Saidas" (envios). Filtro ativo em gold solido.
- **Lista de transacoes** — cada transacao e um card em vidro (TransactionRow) com: nome do participante, badge de tipo (Aluno, Empresa, Professor, Admin), chave MoneYoung, valor (verde para entradas, vermelho para saidas) e data.

Se nao houver transacoes para o filtro selecionado, exibe "Nenhuma transacao para este filtro."

### Notificacoes (`/notifications`)
Tela com as notificacoes do usuario, baseadas nas transacoes reais. Adapta-se ao tipo de conta.

Tipos de notificacao:
- **Bem-vindo ao MoneYoung!** — notificacao fixa de boas-vindas com icone de megafone dourado.
- **Recebeu [valor]** — quando o usuario recebe uma transferencia. Icone de seta para baixo em verde. Mostra "De [nome do remetente]".
- **Enviou [valor]** — quando o usuario envia uma transferencia. Icone de seta para cima em vermelho. Mostra "Para [nome do destinatario]".
- **Credito inicial** — quando o banco credita Youngcoins na carteira. Icone de carteira em amarelo.

Cada notificacao exibe o tempo relativo (Agora, 5min, 2h, Ontem, ou data completa).

- **Botao "Limpar tudo"** — remove todas as notificacoes da tela (visual, nao deleta do banco).

### Alunos (`/students`)
Tela exclusiva para colaboradores (sub_business). Lista todos os alunos ativos vinculados a escola com seus saldos.

**Protecao por PIN:**
- Ao abrir, solicita o PIN da escola (definido pelo banco no painel admin).
- Campo numerico com mascara (ate 8 digitos).
- **Botao "Desbloquear"** — valida o PIN. Se incorreto, exibe toast de erro e limpa o campo.
- Se a escola nao tiver PIN definido, a tela abre direto sem solicitar.

**Apos desbloqueio:**
- **Header** — "Alunos (N)" com o total de alunos ativos.
- **Botao "Receber pagamento"** — botao gold no topo que abre o QR Code da escola (para receber pagamentos de alunos).
- **Lista de alunos** — cada aluno e um card em vidro com: avatar (inicial do nome), nome completo, chave MoneYoung e saldo em YC.
- **Botoes por aluno:**
  - **"Transferir"** — navega para `/transfer` com a chave do aluno pre-preenchida (para enviar YC da escola para o aluno).
  - **"Receber"** — navega para `/receive` (exibe QR Code da escola para o aluno pagar).

### Perfil (`/profile`)
Tela com os dados pessoais do usuario. Funciona para todos os tipos de conta.

- **Avatar** — circulo dourado grande com a inicial do nome, com glow e borda luminosa.
- **Nome** e **chave MoneYoung** — abaixo do avatar.
- **Badge da escola** — se o usuario pertence a uma escola, exibe card em vidro com nome da organizacao e role (Professor, Funcionario, Diretor, Aluno).

**Informacoes exibidas** (card em vidro com icones dourados):
- Young Key — chave MoneYoung do usuario.
- Email — email da conta Google.
- Tipo de conta — Pessoal (Aluno), Escola ou Colaborador.
- Status — Ativo, Pendente, Bloqueado ou Cancelado.
- Data de nascimento — formato DD/MM/AA (se informada no cadastro).
- Localizacao — cidade, estado, pais (se informados).
- Esporte favorito (se informado).
- Hobby (se informado).
- Conta aberta em — data de criacao do perfil no formato DD/MM/AA.

**Secao "Sobre"** — texto livre do usuario (se preenchido no cadastro).

**Acoes:**
- **"Cancelar minha conta"** — solicita cancelamento ao banco. Exibe confirmacao antes de prosseguir. Apos solicitar, mostra banner "Cancelamento solicitado. Aguardando aprovacao do banco." O botao desaparece enquanto aguarda.
- **"Sair da conta"** — faz logout e redireciona para o login.

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
