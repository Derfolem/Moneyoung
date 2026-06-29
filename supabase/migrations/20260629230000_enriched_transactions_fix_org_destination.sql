-- Corrige origem e destino quando a wallet é da organização (profile_id = null)
-- Agora to_display_name retorna o nome da org via COALESCE com organizations.name
-- Para origem de professor: created_by_display_name (já exposto) é usado como fallback no render

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
  fp.display_name                                                              AS from_display_name,
  fp.young_key                                                                 AS from_young_key,
  fp.account_type::text                                                        AS from_account_type,
  fp.role                                                                      AS from_role,
  COALESCE(tp.display_name, to_org.name)                                       AS to_display_name,
  COALESCE(tp.young_key,    to_org.slug)                                       AS to_young_key,
  COALESCE(tp.account_type::text, CASE WHEN to_org.id IS NOT NULL THEN 'business' END) AS to_account_type,
  tp.role                                                                      AS to_role,
  cp.display_name                                                              AS created_by_display_name,
  cp.young_key                                                                 AS created_by_young_key,
  cp.account_type                                                              AS created_by_account_type
FROM public.transactions t
LEFT JOIN public.wallets fw       ON fw.id       = t.from_wallet_id
LEFT JOIN public.profiles fp      ON fp.id       = fw.profile_id
LEFT JOIN public.wallets tw       ON tw.id       = t.to_wallet_id
LEFT JOIN public.profiles tp      ON tp.id       = tw.profile_id
LEFT JOIN public.organizations to_org ON to_org.id = tw.organization_id AND tp.id IS NULL
LEFT JOIN public.profiles cp      ON cp.id       = t.created_by;
