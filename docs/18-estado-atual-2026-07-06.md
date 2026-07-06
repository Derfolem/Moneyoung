# Estado Atual — 2026-07-06

## Resumo da sessao

Fred comprou o dominio **moneyoung.com** na GoDaddy. Sessao dedicada a configurar o dominio proprio em todo o projeto e criar a landing page institucional (ate entao inexistente).

## Estrutura de dominio definida

- **`admin.moneyoung.com`** → painel administrativo (`apps/web-admin`, projeto Vercel `mygbank`, ja existente)
- **`moneyoung.com`** e **`www.moneyoung.com`** → landing page institucional (`apps/landing`, novo projeto Vercel `moneyoung-landing`)

DNS configurado na GoDaddy com registros A apontando para `76.76.21.21` (IP recomendado pela Vercel). Certificados HTTPS emitidos automaticamente pela Vercel para os tres hosts.

Redirect URL `https://admin.moneyoung.com/**` adicionada manualmente no Supabase Dashboard (Authentication > URL Configuration) para o login OAuth do painel funcionar no novo dominio. O codigo do painel ja usa `window.location.origin` dinamicamente (`apps/web-admin/app/login/page.tsx`), entao nenhuma alteracao de codigo foi necessaria ali.

## Novo projeto: apps/landing

Criado um novo workspace `@moneyoung/landing` (Next.js 14, App Router), separado do `apps/web-admin`, com:

- **`/`** — pagina inicial minimalista: fundo preto solido, logo oficial MoneYoung (`Logo principal Moneyoung.png` do mockup de Fagner) centralizado. Sem conteudo adicional, a pedido do Fred ("pagina simples").
- **`/politica-de-privacidade`** — pagina publica com a politica de privacidade real do produto (dados coletados, finalidade, nao compartilhamento com terceiros, direitos do usuario, contato `contato@moneyoung.com`). Resolve o item obrigatorio 2.10.4 do checklist (URL de privacidade exigida por Google Play e Apple App Store).

Deploy feito via `npx vercel` (CLI ja autenticado como `agentcodi01-1544` no time `moneyoung`, sem instalacao global necessaria).

A politica de privacidade inicial (resumida) foi substituida por um Aviso de Privacidade completo em conformidade com a LGPD, adaptado do modelo usado pela Tangram Educacao para o contexto do MoneYoung: MoneYoung como controlador da plataforma, instituicao de ensino como controladora dos dados de alunos/colaboradores que autoriza, suboperadores reais (Supabase para banco de dados/autenticacao, Vercel para hospedagem), dados efetivamente coletados pelo cadastro (nome completo, data de nascimento, e-mail via Google, chave MoneYoung gerada automaticamente) e sistema proprio de monitoramento de erros (nao usa Sentry). Sem CNPJ/razao social nem telefone por enquanto — a pedido do Fred, contato exclusivamente por `contato@moneyoung.com`.

## Build Android (EAS)

- Fred fez login no Expo (`eas login`) — conta `agentcodi01` (frederic.melo25@outlook.com)
- Projeto EAS criado via `eas init --force`: `@agentcodi01/moneyoung`, ID `16888fa9-b2b9-4f32-9613-46bb7385b52e` — adicionado a `EAS_PROJECT_ID` no `.env` raiz (app.config.ts ja lia essa variavel dinamicamente)
- `apps/mobile/eas.json` atualizado: `cli.appVersionSource: "remote"` (corrige aviso da CLI), profile `production` ganhou `autoIncrement: true` (Android e iOS), `ios.simulator: false` e as env vars do Supabase (antes so o profile `preview` tinha)
- Build APK preview disparado (`eas build --platform android --profile preview --non-interactive --no-wait`), rodando na fila gratuita do EAS. Build ID `ad98e925-d101-4805-8c6e-52c8a64c444f`. Nota: o build usa o diretorio nativo `android/` ja existente no projeto (nao gera do zero a partir do `app.config.ts`) — o valor de `android.package` no config e ignorado, prevalece o que estiver no `android/app/build.gradle`.

## Checklist atualizado

- 3.3 "Configurar dominio proprio" → marcado como concluido
- 2.10.4 "URL de politica de privacidade" → marcado como concluido
- 2.9 "Configurar EAS_PROJECT_ID", "Criar conta no Expo" e "Configurar eas.json" → marcados como concluidos
- 2.9 "Gerar APK preview" → em andamento (aguardando fila do EAS)

## Proximos passos

1. Build Android (2.9) — aguardar o APK preview terminar; Fred nao possui celular Android fisico, entao o teste em dispositivo real fica pendente (avaliar emulador Android Studio, device emprestado, ou teste em nuvem)
2. Sign in with Apple (2.10.2) — obrigatorio pela Apple para apps com login Google
3. Conteudo completo da landing page (hoje e so o logo — apresentacao do produto, links para as lojas, contato, podem ser adicionados depois)
4. Reteste do fluxo de dados reais (item 4.2) — Fred pediu para nao marcar como concluido ainda, sera testado novamente em sessao futura
