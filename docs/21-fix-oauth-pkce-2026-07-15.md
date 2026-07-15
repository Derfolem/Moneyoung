# Login Google OAuth no app nativo — RESOLVIDO (2026-07-15)

Login Google no app mobile (Android) passou a funcionar **de ponta a ponta**. Documenta o diagnóstico e a correção, encerrando a saga que começou em 2026-07-14 (ver `docs/20-chamado-supabase-oauth-redirect-bug.md`).

## Duas causas, em sequência

### Causa 1 — bug de plataforma do Supabase (corrigido do lado deles)
Até 2026-07-14, o `/auth/v1/callback` ignorava o `redirect_to` e sempre caía no Site URL (`http://localhost:8081`), mesmo com `moneyoung://auth/callback` na allowlist. Chamado de suporte foi aberto. **Em 2026-07-15 o redirect voltou a funcionar** — confirmado nos logs: `/authorize` com `referer: moneyoung://auth/callback` seguido de `/callback` 302 correto. Provavelmente relacionado à propagação de config de Auth após pausa/retomada automática do projeto free tier. Followup enviado ao suporte confirmando a resolução.

### Causa 2 — app não completava o PKCE (era do nosso código)
Mesmo com o redirect correto, o login falhava com "Sessao invalida ou expirada". Diagnóstico:

- A mensagem NÃO vinha do GoTrue, e sim da edge function (`supabase/functions/_shared/supabase.ts` → `requireUser()`). O app chamava `ensureProfile()` **sem sessão estabelecida** → `getUser()` com anon key → `403: invalid claim: missing sub claim` nos logs de auth.
- O APK instalado no emulador foi buildado **antes** da linha `flowType: "pkce"` entrar no `supabase.ts`. Sem `code_challenge`, o GoTrue usava fluxo implícito (tokens no `#fragment`), mas o app só lia `?code=`.
- **Prova definitiva:** `select * from auth.flow_state` — o `/authorize` daquele dia não criou flow state (sem `code_challenge`). E o teste com deep link de código falso (`adb shell am start -d "moneyoung://auth/callback?code=fake"`) gerou `POST /token 400 "both auth code and code verifier should be non-empty"`, provando que o encanamento deep-link→callback→exchange funcionava; faltava só o code real com o verifier.

## Correção (commit 17ee370)

- `apps/mobile/src/services/auth.ts`: aceita `?code=` (PKCE) **e** tokens no fragment (`#access_token`) via `setSession` como fallback; tolera corrida se a rota `/auth/callback` trocou o mesmo código primeiro.
- `apps/mobile/app/auth/callback.tsx`: lê a URL crua via `Linking.useURL()` (fragment incluído); não chama mais `ensureProfile()` sem sessão; sem code/tokens volta ao login em vez de travar.
- `apps/mobile/app/_layout.tsx`: os guards de sessão (boot + `onAuthStateChange`) não expulsam mais para `/login` quando a rota atual é `/auth/*` — era isso que atropelava o deep link do callback em cold start.

Build EAS de validação: `d31fa1a0-0adb-4637-88dd-bd687d326987` (preview APK). Verificado via `strings` no `index.android.bundle` que o bundle contém `pkce`, `code_challenge`, `parseAuthFromUrl` e o fallback de `setSession`.

## Evidência do sucesso (logs Supabase, 2026-07-15T14:35Z)

| Etapa | Antes (13:09) | Depois (14:35) |
|---|---|---|
| `login_method` | `oauth` (implícito) | `pkce` |
| `POST /token` | 400 / ausente | 200 |
| `GET /user` | 403 "missing sub claim" | 200 |

App abriu na home como aluno **OFruto** (`@ALN-ofrutoteste7750`), saldo 50,00 YC e últimas transações reais renderizadas.

## Pendências relacionadas

- Teste em **dispositivo Android físico** (Fred não possui — segue como item aberto no checklist 2.9).
- **Sign in with Apple** (obrigatório pela Apple para apps com login social) — item 2.10.
- Build de **produção** (AAB) e build **iOS** — devem herdar estes mesmos fixes já commitados.
