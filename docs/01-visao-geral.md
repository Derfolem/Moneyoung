# Visao geral

YoungCoin e uma carteira digital educacional com moeda YC. O MVP funciona como um banco digital simples: todos tem conta YoungCoin; escolas usam conta empresa; alunos e professores usam conta comum.

## Objetivo do MVP

Entregar app mobile, painel administrativo, backend Supabase, ledger auditavel, OAuth Google, estorno, bloqueio de wallet e documentacao.

## Incluido

- Login Google OAuth.
- Profile, young_key e wallet automaticos.
- Saldo, transferencia, recebimento por QR, pagamento por QR e extrato.
- Painel admin com contas, wallets, transacoes, auditoria, seguranca, organizacoes, limites e CSV.
- Ledger com transacoes imutaveis e estorno.

## Nao incluido

CPF, RG, endereco, telefone obrigatorio, KYC, biometria, reconhecimento facial, bonus pedagogico, marketplace e loja de recompensas.

## Perfis

- `common_user`: envia, recebe, paga e consulta.
- `organization_admin`: administra vinculos de organizacao.
- `bank_admin`: administra YoungCoin pelo painel.
- `super_admin`: acesso tecnico global.

## Fluxo geral

Usuario entra com Google, a Edge Function cria profile e wallet, o app consulta resumo, e qualquer movimento financeiro passa por funcao segura que valida autenticacao, status, saldo, limites e idempotencia.
