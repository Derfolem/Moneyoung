# Moneyoung (MYG)

Moneyoung e uma plataforma bancaria digital educacional que opera com a moeda virtual Youngcoin (YC). O MVP inclui app mobile Expo, painel web Next.js (Moneyoung Bank), Supabase Auth, PostgreSQL, Edge Functions, ledger auditavel e documentacao operacional. Faz parte do projeto VemCer.

## Progresso do MVP

Consulte **[docs/00-checklist-mvp.md](docs/00-checklist-mvp.md)** para o checklist completo do projeto, do zero ate producao para 400 alunos. Sempre marque os itens concluidos e justifique os que nao forem realizados.

## Identidade

- **Moneyoung (MYG)**: nome do app e da plataforma.
- **Youngcoin (YC)**: nome da moeda virtual. Codigo da moeda: YC.
- **Moneyoung Bank**: nome do banco digital (painel admin).
- **VemCer**: nome do projeto educacional.

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

### Pre-requisitos

1. Copie `.env.example` para `.env` e preencha as chaves Supabase (ou use as que ja estao configuradas).
2. Instale as dependencias: `npm install` na raiz do projeto.

Os scripts do monorepo carregam o `.env` da raiz automaticamente via `dotenv`.
Cada app tambem possui um symlink `.env.local -> ../../.env` para que Next.js e Expo leiam as variaveis corretamente em modo dev.

### Painel Web Admin (porta 3000)

Rode do diretorio raiz:

```bash
npm run dev:web
```

Abra `http://localhost:3000`. Login via Google OAuth (conta bank_admin).

### App Mobile Expo (porta 8081)

Rode do diretorio raiz:

```bash
npm run dev:mobile
```

Abra `http://localhost:8081` para testar no navegador, ou escaneie o QR code com Expo Go no celular.

**Importante:** se `npm run dev:mobile` apresentar tela branca, rode diretamente do diretorio do app:

```bash
cd apps/mobile
CI=1 EXPO_USE_METRO_WORKSPACE_ROOT=1 DOTENV_CONFIG_PATH=../../.env \
  node -r dotenv/config ../../node_modules/expo/bin/cli start --port 8081
```

### Emulador Android

```bash
~/Android/emulator-compat -avd Pixel_6_API_34
cd apps/mobile
npx expo run:android
```

O emulador pode falhar com `stack smashing detected` por causa do workaround de GLIBC. Reinicie o wrapper e tente novamente.

### Supabase local (opcional)

```bash
npm run supabase:start
npm run supabase:migrate
npm run supabase:functions
```

O projeto esta conectado ao Supabase Cloud (producao). Use Supabase local apenas para desenvolvimento de migrations e Edge Functions.

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

Comece por **`docs/00-checklist-mvp.md`** para saber o que falta fazer.

Leia `docs/01-visao-geral.md` ate `docs/10-roadmap.md` para detalhes completos.
Leia tambem `docs/11-estado-atual-2026-06-16.md` antes de retomar o trabalho.
