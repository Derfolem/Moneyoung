-- Recriar enriched_wallets com SECURITY INVOKER
DROP VIEW IF EXISTS public.enriched_wallets;
CREATE VIEW public.enriched_wallets WITH (security_invoker = on) AS
SELECT w.id,
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

-- Recriar enriched_transactions com SECURITY INVOKER
DROP VIEW IF EXISTS public.enriched_transactions;
CREATE VIEW public.enriched_transactions WITH (security_invoker = on) AS
SELECT t.id,
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
    fp.display_name AS from_display_name,
    fp.young_key AS from_young_key,
    fp.account_type AS from_account_type,
    fp.role AS from_role,
    tp.display_name AS to_display_name,
    tp.young_key AS to_young_key,
    tp.account_type AS to_account_type,
    tp.role AS to_role,
    cp.display_name AS created_by_display_name,
    cp.young_key AS created_by_young_key
FROM transactions t
LEFT JOIN wallets fw ON fw.id = t.from_wallet_id
LEFT JOIN profiles fp ON fp.id = fw.profile_id
LEFT JOIN wallets tw ON tw.id = t.to_wallet_id
LEFT JOIN profiles tp ON tp.id = tw.profile_id
LEFT JOIN profiles cp ON cp.id = t.created_by;
