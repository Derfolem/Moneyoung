-- View enriquecida de wallets: junta com profiles para mostrar nome, chave e tipo
CREATE OR REPLACE VIEW enriched_wallets AS
SELECT
  w.id,
  w.profile_id,
  p.display_name AS owner_name,
  p.young_key AS owner_young_key,
  p.account_type AS owner_account_type,
  w.organization_id,
  o.name AS organization_name,
  w.wallet_type,
  w.balance,
  w.status,
  w.created_at,
  w.updated_at
FROM wallets w
LEFT JOIN profiles p ON p.id = w.profile_id
LEFT JOIN organizations o ON o.id = w.organization_id;
