# Auditoria

## Acoes com audit log

- Primeiro login/profile criado.
- Transferencia concluida.
- Estorno.
- Bloqueio/desbloqueio/freeze de wallet.
- Criacao de organizacao.

## Rastreamento por tipo de usuario

Transacoes enriquecidas (view `enriched_transactions`) incluem o tipo de conta e nome de cada participante. No extrato e notificacoes do app, badges coloridos indicam se o participante e Aluno (@ALN-), Empresa (@EMP-), Sub-empresa (@SUBEMP-) ou Administrador (@ADM-). Isso facilita auditoria educacional e rastreamento de fluxo de YC.

## Investigar transacao

Abra `/transactions/[id]`, confira dados da transacao, audit logs relacionados, origem, destino, valor, criador, tipo de conta do remetente/destinatario e metadata.

## Estornar

Somente `bank_admin` ou `super_admin`. O botao no detalhe chama `reverse_transaction`, que cria nova transacao e marca a original como `reversed`.

## Bloquear conta

Use `/wallets`, informe `wallet_id`, escolha `blocked`, `frozen` ou `active`. A Edge Function registra audit log.

## Rastrear acao sensivel

Use `/audit` para acoes administrativas e `/security-events` para tentativas invalidas ou suspeitas.

## Eventos de seguranca monitorados

| Evento | Severidade |
|---|---|
| transfer.invalid_amount | medium |
| transfer.origin_wallet_blocked | high |
| transfer.self_transfer | medium |
| transfer.transaction_limit_exceeded | high |
| transfer.daily_limit_exceeded | high |
| transfer.rate_limited | medium |
| transfer.insufficient_funds | medium |
