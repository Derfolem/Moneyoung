# Mobile

## Estrutura

`apps/mobile` usa Expo Router, TypeScript, Supabase client, services e componentes reutilizaveis.

```
apps/mobile/
├── app/                    # Telas (Expo Router)
│   ├── _layout.tsx         # Root layout + auth guard + ToastHost
│   ├── login.tsx           # Login com Google OAuth
│   ├── home.tsx            # Dashboard com saldo
│   ├── transfer.tsx        # Transferir YC
│   ├── transfer-confirm.tsx # Confirmar transferencia
│   ├── receipt.tsx         # Comprovante
│   ├── pay.tsx             # Pagar via QR Code
│   ├── receive.tsx         # Receber (gerar QR Code)
│   ├── statement.tsx       # Extrato com filtros
│   ├── notifications.tsx   # Notificacoes reais (entradas/saidas)
│   └── profile.tsx         # Perfil do usuario
├── src/
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Drawer.tsx
│   │   ├── HexLogo.tsx
│   │   ├── PageHeader.tsx
│   │   ├── Screen.tsx
│   │   ├── StateView.tsx
│   │   ├── Toast.tsx       # Toast visual (substitui Alert.alert)
│   │   └── TransactionRow.tsx # Com nomes e badges de tipo
│   ├── services/
│   │   ├── auth.ts           # Google OAuth (signIn, signOut)
│   │   ├── moneyoung.ts      # Core service (transfer, pay, wallet, translateError)
│   │   ├── supabase.ts       # Cliente Supabase (nativo, SecureStore)
│   │   ├── supabase.web.ts   # Cliente Supabase (web, localStorage)
│   │   └── toast.ts          # Event emitter para toasts globais
│   └── theme/
│       └── colors.ts
└── package.json
```

## Telas

- `/login` — Login Google OAuth
- `/home` — Dashboard com saldo, acoes rapidas e ultimas transacoes
- `/transfer` — Informar destino, valor e descricao
- `/transfer-confirm` — Confirmar antes de executar
- `/receipt` — Comprovante com dados da transacao
- `/pay` — Escanear QR Code ou digitar chave
- `/receive` — QR Code com young_key do usuario
- `/statement` — Extrato com filtros (tudo/entradas/saidas)
- `/notifications` — Entradas e saidas com nomes, valores e badges de tipo
- `/profile` — Dados do usuario

## Modo Demo vs Real

O app funciona em dois modos:
- **Demo**: sem Supabase configurado, usa dados fake para demonstracao
- **Real**: com `.env` preenchido, conecta ao Supabase real

A variavel `isSupabaseConfigured` controla o modo em todos os services.

## Servicos

### auth.ts
- `signInWithGoogle()` — login via OAuth (redirect na web, popup no nativo)
- `signOut()` — encerra sessao
- `hasActiveSession()` — verifica se ha sessao ativa

### moneyoung.ts
- `ensureProfile()` — cria perfil + wallet no primeiro login
- `getWalletSummary()` — busca saldo, perfil e transacoes enriquecidas (com nomes)
- `transferMoneyoung(payload)` — transferir YC
- `payMoneyoung(payload)` — pagar via QR Code
- `parseAmount(value)` — normaliza valor de moeda
- `invoke(name, body)` — chama Edge Function via fetch direto (nao usa supabase.functions.invoke)
- `translateError(raw)` — traduz codigos de erro do backend para portugues

### toast.ts
- `toast.success(title, message?)` — toast verde
- `toast.error(title, message?)` — toast vermelho
- `toast.info(title, message?)` — toast azul
- `toast.subscribe(fn)` — listener para o componente ToastHost

### supabase.ts / supabase.web.ts
- Clientes Supabase com armazenamento seguro (SecureStore no nativo, localStorage na web)
- Header customizado `x-moneyoung-client` para identificar plataforma

## Componentes

### TransactionRow
Mostra cada transacao com:
- Nome do outro participante (quem enviou ou recebeu)
- Badge colorido do tipo de conta (Aluno, Empresa, Professor, Admin)
- Chave Moneyoung do participante
- Tipo da transacao e data
- Valor com cor (verde = entrada, vermelho = saida)

### Toast (ToastHost)
Componente global montado no `_layout.tsx`. Recebe eventos do `toast.ts` e mostra notificacao animada no topo da tela com icone, titulo e mensagem. Desaparece apos 4 segundos. Suporta tipos: success (verde), error (vermelho), info (azul).

## Fluxos

Login Google cria profile/wallet no primeiro acesso. Home consulta `get_wallet_summary` que retorna transacoes enriquecidas com nomes e tipos. Transferencia e pagamento chamam `transfer_youngcoin`. Erros sao mostrados como toast visual. Recebimento mostra QR Code com `young_key`.

## Rodar local

```bash
cd ycbank
npm install
npm run dev:mobile
```

Para testar no navegador:

```bash
cd apps/mobile
npm run web
```

Abra `http://localhost:8081`. O script `npm run web` carrega o `.env` da raiz via `dotenv`.

## Android

Na maquina GuttaOS com GLIBC 2.28, o Android Emulator 36.6.11 precisa do wrapper local:

```bash
~/Android/emulator-compat -avd Pixel_6_API_34
cd apps/mobile
npx expo run:android
```

```bash
npm run build:android:preview
```

O profile `preview` gera APK.

## Variaveis

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EAS_PROJECT_ID`

Com essas variaveis vazias, apenas o modo demo funciona.
