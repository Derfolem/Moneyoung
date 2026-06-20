# Backend Edge Functions

## Funcoes

- `create_profile_on_first_login`: cria profile com young_key prefixada, e wallet com tipo correspondente.
- `transfer_youngcoin`: recebe `to_young_key`, `amount`, `description`, `idempotency_key`.
- `get_wallet_summary`: retorna profile, wallet e ultimas transacoes enriquecidas (com nomes e tipos dos participantes).
- `reverse_transaction`: admin estorna transacao completed.
- `block_wallet`: admin altera status da wallet.
- `create_organization_account`: admin cria escola e wallet business quando aplicavel.
- `admin_dashboard_summary`: admin consulta indicadores.

## Transacoes Enriquecidas

A funcao `get_wallet_summary` consulta a view `enriched_transactions` em vez da tabela `transactions` direta. A resposta inclui para cada transacao:

| Campo | Descricao |
|---|---|
| from_display_name | Nome de quem enviou |
| from_young_key | Chave de quem enviou |
| from_account_type | Tipo da conta de origem (personal, business, sub_business, system) |
| to_display_name | Nome de quem recebeu |
| to_young_key | Chave de quem recebeu |
| to_account_type | Tipo da conta de destino |

Isso permite que o frontend mostre nomes reais e badges de tipo no extrato e notificacoes.

## Erros

As funcoes retornam `{ error: { code, message } }` com status HTTP apropriado. No frontend, o `invoke()` usa `fetch` direto (nao `supabase.functions.invoke`) para extrair a mensagem de erro real do JSON de resposta.

Codigos de erro comuns:
- `INSUFFICIENT_FUNDS` — Saldo insuficiente
- `DESTINATION_NOT_FOUND` — Destinatario nao encontrado
- `TRANSACTION_LIMIT_EXCEEDED` — Limite por transacao excedido
- `DAILY_LIMIT_EXCEEDED` — Limite diario excedido
- `RATE_LIMITED` — Muitas transacoes em pouco tempo
- `SELF_TRANSFER_BLOCKED` — Transferencia para si mesmo

## Exemplo

```json
{
  "to_young_key": "@ALN-maria4521",
  "amount": 10.5,
  "description": "Pagamento",
  "idempotency_key": "mobile_transfer_123"
}
```

## Validacoes

Autenticacao, role, status da conta, wallet ativa, saldo, limites por tipo de conta, rate limit, idempotencia e tentativa de self-transfer.

## Alerta de escalabilidade

Edge Functions no Supabase sao serverless e escalam automaticamente. Porem, em operacoes financeiras criticas, o cold start pode adicionar latencia.

- Ate 400 acessos simultaneos: sem impacto relevante.
- A partir de 1.000 acessos: monitorar latencia de cold start. Se ultrapassar 500ms, implementar keep-alive.
- A partir de 10.000 acessos: pooling de conexoes via Supavisor em modo `transaction` e obrigatorio.
