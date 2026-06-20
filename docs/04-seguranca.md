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

| Tipo de conta | Limite/transacao | Limite diario | Transacoes/minuto |
|---|---|---|---|
| personal (Aluno) | 250 YC | 1.000 YC | 10 |
| sub_business (Sub-empresa) | 1.000 YC | 5.000 YC | 30 |
| business (Empresa) | 2.500 YC | 10.000 YC | 60 |
| system (Admin) | Ilimitado | Ilimitado | Ilimitado |

## Idempotency key

Chave unica impede duplicidade em reenvios.

## Protecoes

- Saldo nao e alterado no frontend.
- Transferencia para si mesmo e bloqueada.
- Valor negativo e bloqueado.
- Wallet bloqueada/frozen nao movimenta.
- Tentativas invalidas relevantes geram `security_events`.
- Erros do backend sao traduzidos para portugues no frontend (translateError).

## Auditoria de tipo de usuario

Transacoes enriquecidas incluem o tipo de conta (`account_type`) e nome de cada participante. Isso permite rastrear no extrato e notificacoes se quem transferiu foi Aluno, Empresa, Professor ou Administrador.

## Alerta de escalabilidade

- A partir de 1.000 acessos simultaneos, monitorar `security_events` para detectar padroes de abuso.
- A partir de 10.000 acessos, considerar rate limiting no nivel de infraestrutura.

## Nao implementado no MVP

KYC, biometria, reconhecimento facial, antifraude avancado, device binding, analise comportamental e conciliacao externa.
