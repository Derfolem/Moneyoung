-- Fix: enriched_transactions was SECURITY DEFINER (default for views), bypassing RLS on
-- transactions/wallets/profiles entirely. anon and authenticated both had SELECT grants,
-- meaning any signed-in (or even anonymous) request could read every user's transactions.
-- security_invoker makes the view enforce the querying user's own RLS policies instead.
CREATE OR REPLACE VIEW public.enriched_transactions
WITH (security_invoker = true) AS
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
    COALESCE(tp.display_name, to_org.name) AS to_display_name,
    COALESCE(tp.young_key, to_org.slug) AS to_young_key,
    COALESCE(tp.account_type,
        CASE
            WHEN to_org.id IS NOT NULL THEN 'business'::text
            ELSE NULL::text
        END) AS to_account_type,
    tp.role AS to_role,
    cp.display_name AS created_by_display_name,
    cp.young_key AS created_by_young_key,
    cp.account_type AS created_by_account_type
   FROM transactions t
     LEFT JOIN wallets fw ON fw.id = t.from_wallet_id
     LEFT JOIN profiles fp ON fp.id = fw.profile_id
     LEFT JOIN wallets tw ON tw.id = t.to_wallet_id
     LEFT JOIN profiles tp ON tp.id = tw.profile_id
     LEFT JOIN organizations to_org ON to_org.id = tw.organization_id AND tp.id IS NULL
     LEFT JOIN profiles cp ON cp.id = t.created_by;
