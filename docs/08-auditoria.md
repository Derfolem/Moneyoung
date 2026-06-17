# Auditoria

## Acoes com audit log

- Primeiro login/profile criado.
- Transferencia concluida.
- Estorno.
- Bloqueio/desbloqueio/freeze de wallet.
- Criacao de organizacao.

## Investigar transacao

Abra `/transactions/[id]`, confira dados da transacao, audit logs relacionados, origem, destino, valor, criador e metadata.

## Estornar

Somente `bank_admin` ou `super_admin`. O botao no detalhe chama `reverse_transaction`, que cria nova transacao e marca a original como `reversed`.

## Bloquear conta

Use `/wallets`, informe `wallet_id`, escolha `blocked`, `frozen` ou `active`. A Edge Function registra audit log.

## Rastrear acao sensivel

Use `/audit` para acoes administrativas e `/security-events` para tentativas invalidas ou suspeitas.
