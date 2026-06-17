# Seguranca

## Autenticacao

Supabase Auth com OAuth Google. O app nao pede senha manual.

## Autorizacao

Roles vivem em `profiles.role`. Funcoes administrativas validam `bank_admin` ou `super_admin`.

## RLS

Todas as tabelas possuem RLS. Usuario comum le seu profile, sua wallet e transacoes em que participa. Logs e eventos sao visiveis apenas para admins.

## Edge Functions

Operacoes financeiras passam por Edge Functions e RPCs transacionais com service role protegido.

## Rate limit e limites

`transfer_youngcoin_tx` valida limite por transacao, diario e contagem por minuto.

## Idempotency key

Chave unica impede duplicidade em reenvios.

## Protecoes

- Saldo nao e alterado no frontend.
- Transferencia para si mesmo e bloqueada.
- Valor negativo e bloqueado.
- Wallet bloqueada/frozen nao movimenta.
- Tentativas invalidas relevantes geram `security_events`.

## Alerta de escalabilidade

- A partir de 1.000 acessos simultaneos, monitorar `security_events` para detectar padroes de abuso (tentativas em massa, rate limit excedido por muitos usuarios ao mesmo tempo).
- A partir de 10.000 acessos, considerar implementar rate limiting tambem no nivel de infraestrutura (Supabase rate limits ou API gateway externo), alem do rate limit ja existente na RPC `transfer_youngcoin_tx`.

## Nao implementado no MVP

KYC, biometria, reconhecimento facial, antifraude avancado, device binding, analise comportamental e conciliacao externa.
