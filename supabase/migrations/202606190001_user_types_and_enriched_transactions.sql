-- Migration: user type differentiation, young_key prefixes, enriched transactions
-- account_type: personal (alunos), business (colegios/escolas), sub_business (professores/tutores), system (admin banco)
-- young_key: @ALN-nome1234 | @EMP-nome1234 | @PRF-nome1234 | @ADM-nome1234

-- 1. Add sub_business to account_type constraints
alter table public.profiles drop constraint if exists profiles_account_type_check;
alter table public.profiles add constraint profiles_account_type_check
  check (account_type in ('personal','business','sub_business','system'));

alter table public.wallets drop constraint if exists wallets_wallet_type_check;
alter table public.wallets add constraint wallets_wallet_type_check
  check (wallet_type in ('personal','business','sub_business','system'));

alter table public.transfer_limits drop constraint if exists transfer_limits_account_type_check;
alter table public.transfer_limits add constraint transfer_limits_account_type_check
  check (account_type in ('personal','business','sub_business','system'));

-- 2. Add transfer limits for sub_business
insert into public.transfer_limits (account_type, daily_limit, transaction_limit, minute_limit)
values ('sub_business', 5000.00, 1000.00, 30)
on conflict do nothing;

-- 3. Update generate_young_key to include account_type prefix
create or replace function public.generate_young_key(base_text text, p_account_type text default 'personal')
returns text
language plpgsql
as $$
declare
  cleaned text;
  prefix text;
  candidate text;
begin
  cleaned := lower(regexp_replace(coalesce(base_text, 'young'), '[^a-zA-Z0-9]+', '', 'g'));
  if length(cleaned) < 3 then
    cleaned := 'young';
  end if;

  case p_account_type
    when 'business' then prefix := 'EMP';
    when 'sub_business' then prefix := 'SUBEMP';
    when 'system' then prefix := 'ADM';
    else prefix := 'ALN';
  end case;

  loop
    candidate := '@' || prefix || '-' || left(cleaned, 14) || floor(random() * 9000 + 1000)::text;
    exit when not exists (select 1 from public.profiles where young_key = candidate);
  end loop;

  return candidate;
end;
$$;

-- 4. Update create_profile_and_wallet to accept account_type and role
create or replace function public.create_profile_and_wallet(
  p_user_id uuid,
  p_email text,
  p_display_name text,
  p_avatar_url text,
  p_account_type text default 'personal',
  p_role text default 'common_user'
)
returns table(profile public.profiles, wallet public.wallets)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_wallet public.wallets;
  v_account_type text;
  v_role text;
begin
  v_account_type := coalesce(p_account_type, 'personal');
  v_role := coalesce(p_role, 'common_user');

  insert into public.profiles (id, email, display_name, avatar_url, young_key, account_type, role, status)
  values (
    p_user_id, p_email, p_display_name, p_avatar_url,
    public.generate_young_key(split_part(p_email, '@', 1), v_account_type),
    v_account_type, v_role, 'active'
  )
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(public.profiles.display_name, excluded.display_name),
        avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url)
  returning * into v_profile;

  insert into public.wallets (profile_id, wallet_type, status)
  values (p_user_id, v_account_type, 'active')
  on conflict (profile_id) do update set updated_at = now()
  returning * into v_wallet;

  insert into public.audit_logs (actor_profile_id, action, entity_type, entity_id, after_data)
  values (p_user_id, 'profile.first_login_upserted', 'profile', p_user_id, to_jsonb(v_profile));

  return query select v_profile, v_wallet;
end;
$$;

-- 5. Create view for enriched transactions (with participant names and types)
create or replace view public.enriched_transactions as
select
  t.*,
  fp.display_name as from_display_name,
  fp.young_key as from_young_key,
  fp.account_type as from_account_type,
  fp.role as from_role,
  tp.display_name as to_display_name,
  tp.young_key as to_young_key,
  tp.account_type as to_account_type,
  tp.role as to_role
from public.transactions t
left join public.wallets fw on fw.id = t.from_wallet_id
left join public.profiles fp on fp.id = fw.profile_id
left join public.wallets tw on tw.id = t.to_wallet_id
left join public.profiles tp on tp.id = tw.profile_id;

-- 6. RLS on the view (inherits from transactions table since it's a simple view)
-- Views inherit RLS from base tables, but we grant select access
grant select on public.enriched_transactions to authenticated;

-- 7. Helper function to get account type label in pt-BR
create or replace function public.account_type_label(p_account_type text)
returns text
language sql
immutable
as $$
  select case p_account_type
    when 'personal' then 'Aluno'
    when 'business' then 'Empresa'
    when 'sub_business' then 'Professor'
    when 'system' then 'Administrador'
    else 'Desconhecido'
  end;
$$;
