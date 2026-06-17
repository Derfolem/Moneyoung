# Backend Edge Functions

## Funcoes

- `create_profile_on_first_login`: cria profile, young_key e wallet.
- `transfer_youngcoin`: recebe `to_young_key`, `amount`, `description`, `idempotency_key`.
- `get_wallet_summary`: retorna profile, wallet e ultimas transacoes.
- `reverse_transaction`: admin estorna transacao completed.
- `block_wallet`: admin altera status da wallet.
- `create_organization_account`: admin cria escola e wallet business quando aplicavel.
- `admin_dashboard_summary`: admin consulta indicadores.

## Erros

As funcoes retornam `{ error: { code, message } }` com status HTTP apropriado.

## Exemplo

```json
{
  "to_young_key": "@maria1234",
  "amount": 10.5,
  "description": "Pagamento",
  "idempotency_key": "mobile_transfer_123"
}
```

## Validacoes

Autenticacao, role, status da conta, wallet ativa, saldo, limites, rate limit, idempotencia e tentativa de self-transfer.

## Alerta de escalabilidade

Edge Functions no Supabase sao serverless e escalam automaticamente. Porem, em operacoes financeiras criticas (transferencia, estorno), o cold start pode adicionar latencia perceptivel.

- Ate 400 acessos simultaneos: sem impacto relevante.
- A partir de 1.000 acessos: monitorar latencia de cold start no dashboard Supabase. Se ultrapassar 500ms com frequencia, implementar estrategia de keep-alive (chamada periodica para manter a funcao quente).
- A partir de 10.000 acessos: o pooling de conexoes entre Edge Functions e o PostgreSQL via Supavisor em modo `transaction` e obrigatorio. Cada invocacao de funcao nao deve abrir uma conexao direta ao banco.
