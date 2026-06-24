# Arquitetura

```text
Mobile Expo -> Supabase Auth -> Edge Functions -> PostgreSQL
Web Admin  -> Supabase Auth -> Edge Functions -> PostgreSQL
Frontend   -> RLS para leitura permitida
Service role -> somente Edge Functions
```

## Camadas

- Mobile: experiencia da carteira Moneyoung, sem logica financeira critica.
- Web Admin: operacao do Moneyoungbank, sem escrita direta de saldo.
- Edge Functions: validacao, autorizacao, transacoes e audit logs.
- PostgreSQL: RLS, ledger, wallets, limites, views enriquecidas e eventos de seguranca.

## Tecnologias

Expo acelera builds Android/iOS com EAS. Next.js entrega painel admin. Supabase concentra Auth, banco, RLS e Edge Functions. PostgreSQL permite transacoes atomicas e auditoria forte.

## Fluxo de dados

Frontends autenticam, chamam Edge Functions com JWT, a funcao usa service role em ambiente seguro, executa RPC transacional e retorna resultado minimo ao cliente.

## View enriched_transactions

View SQL que junta `transactions` com `wallets` e `profiles` para retornar nomes, chaves e tipos de conta dos participantes em cada transacao. Usada pelo Edge Function `get_wallet_summary` para alimentar extrato, notificacoes e auditoria no frontend.

## Identidade Visual

Ambas as plataformas usam tema dark navy (#0A1628) + gold (#D4A843) com a marca **MoneYoung** em Josefin Sans 700 Bold.

- Mobile: paleta em `src/theme/colors.ts` (inclui tokens glass/glow/dust/orb), fonte carregada via `@expo-google-fonts/josefin-sans` no `_layout.tsx`, componente `TextLogo.tsx` para o wordmark, `BottomNav.tsx` com 5 abas fixas (variante staff para colaboradores).
- Web Admin: paleta em CSS custom properties (`globals.css`), fontes Josefin Sans + Inter via Google Fonts `@import`, marca no sidebar (`AdminShell.tsx`).

## Sistema Visual Premium (Mobile)

O mobile usa 4 camadas visuais para uma experiencia premium:

1. **Glassmorphism**: cards e superficies com fundo semi-transparente (`rgba(15,32,53,0.45)`), blur CSS (`backdrop-filter: blur(16px)`) e borda luminosa sutil. Componente `GlassCard.tsx`.
2. **Energia**: glow dourado pulsante nos botoes primarios (shadow animada via Animated API), text-shadow dourado nos valores de saldo.
3. **Poeira de Ouro**: 14 particulas douradas animadas que flutuam com drift horizontal. Componente `GoldDust.tsx`.
4. **Orbs Ambientais**: 3 circulos grandes semi-transparentes posicionados no fundo das telas para criar profundidade. Componente `AmbientOrbs`.

## Sistema de feedback (Toast)

O frontend mobile usa um sistema de Toast global (`src/services/toast.ts` + `src/components/Toast.tsx`) que substitui `Alert.alert` do React Native. Funciona tanto na web quanto no nativo, com animacao e suporte a sucesso/erro/info. Montado no `_layout.tsx` raiz.

## Traducao de erros

Erros retornados pelo backend em codigos (`INSUFFICIENT_FUNDS`, `DESTINATION_NOT_FOUND`, etc.) sao traduzidos para portugues no frontend pela funcao `translateError()` em `moneyoung.ts`.

## Autenticacao OAuth (Web)

O cliente Supabase web usa `detectSessionInUrl: true` para processar o callback OAuth do Google (hash fragment na URL). Storage separado: `localStorage` na web, `expo-secure-store` no nativo. O `_layout.tsx` detecta convites pendentes em localStorage para redirecionar ao `/register` apos OAuth.
