# Estado atual - 2026-06-16

Este documento registra o ponto de retomada do projeto Moneyoung MVP.

## Ambiente

- Projeto: `~/APPs/Fagner/ycbank`
- Monorepo npm workspaces
- Mobile: Expo SDK 51, React Native 0.74.5, Expo Router 3.5.x
- Web admin: Next.js 14.2.33
- Sistema: GuttaOS com GLIBC 2.28
- Node.js observado: v22.x

## Controle De Escopo

- O Git funcional do MVP fica em `~/APPs/Fagner/ycbank/.git`.
- O caminho `~/APPs/Fagner/.git` não deve ser usado como base do MVP.
- Alteracoes de codigo do produto devem ficar dentro de `ycbank/`.
- Conteudo em `Fagner_documents/` pertence a documentacao/apresentacao e nao ao app.
- Quando outra IA continuar o trabalho, ela deve confirmar o root Git antes de editar qualquer arquivo.

## O que esta funcionando

- App mobile web compila e abre no navegador.
- Modo demo permite entrar sem Supabase configurado.
- Painel web admin sobe localmente.
- TypeScript do app mobile passa em `npm --workspace apps/mobile run lint`.

## Como rodar mobile web

```bash
cd ~/APPs/Fagner/ycbank/apps/mobile
EXPO_USE_METRO_WORKSPACE_ROOT=1 npx expo start --web
```

Abrir:

```text
http://localhost:8081
```

Com `.env` vazio, clique em `Entrar no modo demo`.

## Como rodar web admin

```bash
cd ~/APPs/Fagner/ycbank/apps/web-admin
npm run dev
```

Abrir:

```text
http://localhost:3000
```

## Modo demo mobile

Quando `EXPO_PUBLIC_SUPABASE_URL` e `EXPO_PUBLIC_SUPABASE_ANON_KEY` estao vazios, o app nao chama Google OAuth nem Edge Functions.

Dados locais usados:

- Usuario: `Usuario Demo`
- Email: `demo@moneyoung.local`
- Young Key: `@demo`
- Saldo inicial: `250 YC`

Transferencias no modo demo ficam apenas em memoria durante a sessao do bundle.

## Arquivos importantes alterados

- `package.json`: overrides para `react-native-screens` e `next`, dependencias base do monorepo.
- `apps/web-admin/package.json`: scripts com dotenv e Next local.
- `apps/mobile/package.json`: scripts com dotenv usando CLI da raiz.
- `apps/mobile/app.config.ts`: `web.bundler = "metro"`.
- `apps/mobile/metro.config.js`: resolucao de modulos da raiz do monorepo.
- `apps/mobile/src/services/supabase.web.ts`: cliente Supabase web usando `localStorage`.
- `apps/mobile/src/services/auth.ts`: no modo demo, login retorna sem OAuth.
- `apps/mobile/src/services/moneyoung.ts`: dados demo quando Supabase nao esta configurado.
- `apps/mobile/app/login.tsx`: botao `Entrar no modo demo`.
- `apps/mobile/app/_layout.tsx`: nao redireciona por auth no modo demo.

## Android local

O Android Emulator instalado exige GLIBC mais nova que a do sistema. Foi criado um workaround fora do repo:

- `~/glibc-compat`
- `~/Android/emulator-compat`

Comando:

```bash
~/Android/emulator-compat -avd Pixel_6_API_34
```

Depois que o Android abrir:

```bash
cd ~/APPs/Fagner/ycbank/apps/mobile
npx expo run:android
```

Status: instavel. Pode falhar com `stack smashing detected`; reiniciar o wrapper costuma resolver.

## Supabase

Ainda nao configurado. O arquivo `.env` da raiz existe, mas as variaveis estao vazias.

Variaveis necessarias para fluxo real:

```text
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
EAS_PROJECT_ID=
```

## Proximos passos recomendados

1. Decidir se o proximo teste sera Supabase local ou projeto Supabase real.
2. Preencher `.env` com as chaves corretas.
3. Rodar migrations e Edge Functions.
4. Testar login Google real no mobile web e no web admin.
5. Testar `npx expo run:android` com o emulador ja aberto.
6. Confirmar sempre o root Git do MVP antes de novos commits ou trabalho paralelo.
