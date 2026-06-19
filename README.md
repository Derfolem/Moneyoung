# Moneyoung

Moneyoung e uma carteira digital educacional com identidade propria de moeda universal. O MVP inclui app mobile Expo, painel web Next.js, Supabase Auth, PostgreSQL, Edge Functions, ledger auditavel e documentacao operacional.

## Estrutura

- `apps/mobile`: app React Native + Expo Router.
- `apps/web-admin`: painel administrativo Next.js.
- `packages/shared`: tipos e helpers compartilhados.
- `supabase/migrations`: schema, RLS e RPCs transacionais.
- `supabase/functions`: Edge Functions seguras.
- `docs`: documentacao do produto, arquitetura, seguranca e deploy.
- `scripts`: validacoes locais.

## Controle De Versao

- O repositório Git funcional fica em `~/APPs/Fagner/ycbank/.git`.
- Evite usar o caminho pai `~/APPs/Fagner/.git` para o MVP; ele não é o repo do aplicativo.
- Ao trabalhar com agentes paralelos, limite mudanças ao escopo do MVP em `ycbank` e trate `Fagner_documents/` como documentação separada.

## Instalar

```bash
cd ycbank
npm install
```

Copie `.env.example` para `.env` e preencha as chaves publicas do Supabase. Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` em mobile ou web.
Os scripts do monorepo carregam esse `.env` da raiz automaticamente.

## Rodar

Estado atual de desenvolvimento:

- O app mobile web roda sem Supabase configurado usando modo demo local.
- O painel web admin sobe, mas dados reais dependem das variaveis Supabase.
- O Android emulator nesta maquina usa wrapper local por incompatibilidade de GLIBC.

```bash
npm run supabase:start
npm run supabase:migrate
npm run supabase:functions
npm run dev:web
npm run dev:mobile
```

Para testar o app mobile no navegador, use:

```bash
cd apps/mobile
EXPO_USE_METRO_WORKSPACE_ROOT=1 npx expo start --web
```

Abra `http://localhost:8081`. Com `.env` vazio, a tela de login mostra `Entrar no modo demo`, cria um usuario local de teste e permite navegar pelo app sem OAuth.

Para rodar o painel admin:

```bash
cd apps/web-admin
npm run dev
```

Abra `http://localhost:3000`.

O app mobile esta em Expo SDK 51. Se o Expo Go do iPhone pedir SDK 54, use um simulador iOS, gere um development build, ou migre o app para SDK 54 antes de testar no Expo Go atual.

Para testar no emulador Android desta maquina:

```bash
~/Android/emulator-compat -avd Pixel_6_API_34
cd apps/mobile
npx expo run:android
```

O emulador pode falhar com `stack smashing detected` por causa do workaround de GLIBC. Reinicie o wrapper e tente novamente.

## Builds

```bash
npm run build:web
npm run build:android:preview
npm run build:ios:preview
```

Android gera APK no profile `preview`. iOS usa EAS para simulador no profile `preview`; para dispositivo/TestFlight ajuste certificados e profile EAS.

## Testes

```bash
npm test
```

O script cobre criacao de profile, wallet, transferencia, bloqueios basicos, estorno admin, audit log e idempotencia.

## Docs

Leia `docs/01-visao-geral.md` ate `docs/10-roadmap.md` para detalhes completos.
Leia tambem `docs/11-estado-atual-2026-06-16.md` antes de retomar o trabalho.
