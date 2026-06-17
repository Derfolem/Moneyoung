# Mobile

## Estrutura

`apps/mobile` usa Expo Router, TypeScript, Supabase client, services e componentes reutilizaveis.

## Telas

- `/login`
- `/home`
- `/transfer`
- `/pay`
- `/receive`
- `/statement`
- `/profile`

## Fluxos

Login Google cria profile/wallet no primeiro acesso. Home consulta `get_wallet_summary`. Transferencia e pagamento chamam `transfer_youngcoin`. Recebimento mostra QR Code com `young_key`.

Quando `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` estao vazios, o app entra em modo demo. Nesse modo, o login nao chama OAuth, cria um usuario local `demo@youngcoin.local`, mostra a chave `@demo`, saldo inicial de `250 YC` e registra transferencias apenas em memoria.

## Rodar local

```bash
cd ycbank
npm install
npm run dev:mobile
```

Para testar no navegador nesta estrutura de monorepo, use:

```bash
cd apps/mobile
EXPO_USE_METRO_WORKSPACE_ROOT=1 npx expo start --web
```

Abra `http://localhost:8081`.

O arquivo `apps/mobile/metro.config.js` aponta o Metro para os `node_modules` da raiz do monorepo. O arquivo `src/services/supabase.web.ts` substitui o cliente nativo no web e usa `localStorage` em vez de `expo-secure-store`.

## Android

Na maquina GuttaOS com GLIBC 2.28, o Android Emulator 36.6.11 precisa do wrapper local:

```bash
~/Android/emulator-compat -avd Pixel_6_API_34
cd apps/mobile
npx expo run:android
```

O wrapper usa bibliotecas em `~/glibc-compat`. Se aparecer `stack smashing detected`, reinicie o emulador pelo wrapper e tente novamente.

```bash
npm run build:android:preview
```

O profile `preview` gera APK.

## iOS

```bash
npm run build:ios:preview
```

O profile inicial esta configurado para simulador. Para dispositivo/TestFlight, configure Apple Developer no EAS.

## Variaveis

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EAS_PROJECT_ID`

Com essas variaveis vazias, apenas o modo demo funciona. Para auth real, profile, wallet e ledger persistente, preencha o `.env` da raiz ou suba o Supabase local.
