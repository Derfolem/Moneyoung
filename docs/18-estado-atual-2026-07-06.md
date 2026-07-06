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

## Checklist atualizado

- 3.3 "Configurar dominio proprio" → marcado como concluido
- 2.10.4 "URL de politica de privacidade" → marcado como concluido

## Proximos passos

1. Build Android (2.9) — Fred nao possui celular Android fisico; avaliar emulador Android Studio, device emprestado, ou teste em nuvem antes do teste em dispositivo real
2. Sign in with Apple (2.10.2) — obrigatorio pela Apple para apps com login Google
3. Conteudo completo da landing page (hoje e so o logo — apresentacao do produto, links para as lojas, contato, podem ser adicionados depois)
4. Reteste do fluxo de dados reais (item 4.2) — Fred pediu para nao marcar como concluido ainda, sera testado novamente em sessao futura
