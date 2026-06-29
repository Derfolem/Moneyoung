-- Adiciona created_by_account_type à view enriched_transactions
-- Necessário para exibir o nome e cargo do professor como origem
-- em transferências feitas pela carteira da escola (transfer_from_org)

CREATE OR REPLACE VIEW public.enriched_transactions AS
SELECT
  t.id,
  t.idempotency_key,
  t.from_wallet_id,
  t.to_wallet_id,
  t.amount,
  t.type,
  t.status,
  t.description,
  t.metadata,
  t.created_by,
  t.created_at,
  t.reversed_transaction_id,
  fp.display_name     AS from_display_name,
  fp.young_key        AS from_young_key,
  fp.account_type     AS from_account_type,
  fp.role             AS from_role,
  tp.display_name     AS to_display_name,
  tp.young_key        AS to_young_key,
  tp.account_type     AS to_account_type,
  tp.role             AS to_role,
  cp.display_name     AS created_by_display_name,
  cp.young_key        AS created_by_young_key,
  cp.account_type     AS created_by_account_type
FROM public.transactions t
LEFT JOIN public.wallets fw  ON fw.id  = t.from_wallet_id
LEFT JOIN public.profiles fp ON fp.id  = fw.profile_id
LEFT JOIN public.wallets tw  ON tw.id  = t.to_wallet_id
LEFT JOIN public.profiles tp ON tp.id  = tw.profile_id
LEFT JOIN public.profiles cp ON cp.id  = t.created_by;
