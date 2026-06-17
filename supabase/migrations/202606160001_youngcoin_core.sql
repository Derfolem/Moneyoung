-- YoungCoin core schema, RLS policies and secure RPCs.
-- Ledger is the source of truth. Wallet balance is a cached projection updated only by secure server-side functions.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  display_name text,
  avatar_url text,
  young_key text unique not null,
  account_type text not null check (account_type in ('personal','business','system')),
  role text not null check (role in ('common_user','organization_admin','bank_admin','super_admin')),
  status text not null check (status in ('active','blocked','pending')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  owner_profile_id uuid references public.profiles(id),
  status text not null check (status in ('active','blocked','pending')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  member_role text not null check (member_role in ('student','teacher','staff','admin')),
  status text not null check (status in ('active','blocked','pending')),
  created_at timestamptz default now(),
  unique(organization_id, profile_id)
);

create table if not exists public.wallets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete cascade,
  organization_id uuid references public.organizations(id),
  wallet_type text not null check (wallet_type in ('personal','business','system')),
  balance numeric(18,2) not null default 0 check (balance >= 0),
  status text not null check (status in ('active','blocked','frozen')),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(profile_id)
);

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  idempotency_key text unique not null,
  from_wallet_id uuid references public.wallets(id),
  to_wallet_id uuid references public.wallets(id),
  amount numeric(18,2) not null check (amount > 0),
  type text not null check (type in ('transfer','payment','reversal','initial_credit','admin_adjustment')),
  status text not null check (status in ('pending','completed','failed','reversed')),
  description text,
  metadata jsonb default '{}',
  created_by uuid references public.profiles(id),
  created_at timestamptz default now(),
  reversed_transaction_id uuid references public.transactions(id)
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_profile_id uuid references public.profiles(id),
  action text not null,
  entity_type text not null,
  entity_id uuid,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb default '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

create table if not exists public.transfer_limits (
  id uuid primary key default gen_random_uuid(),
  account_type text not null check (account_type in ('personal','business','system')),
  daily_limit numeric(18,2) not null,
  transaction_limit numeric(18,2) not null,
  minute_limit integer not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.security_events (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id),
  event_type text not null,
  severity text not null check (severity in ('low','medium','high','critical')),
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_wallets_profile_id on public.wallets(profile_id);
create index if not exists idx_transactions_from_wallet on public.transactions(from_wallet_id);
create index if not exists idx_transactions_to_wallet on public.transactions(to_wallet_id);
create index if not exists idx_transactions_created_at on public.transactions(created_at desc);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);
create index if not exists idx_security_events_created_at on public.security_events(created_at desc);

insert into public.transfer_limits (account_type, daily_limit, transaction_limit, minute_limit)
values
  ('personal', 1000.00, 250.00, 10),
  ('business', 10000.00, 2500.00, 60),
  ('system', 999999999.00, 999999999.00, 999999)
on conflict do nothing;

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists touch_organizations_updated_at on public.organizations;
create trigger touch_organizations_updated_at before update on public.organizations
for each row execute function public.touch_updated_at();

drop trigger if exists touch_wallets_updated_at on public.wallets;
create trigger touch_wallets_updated_at before update on public.wallets
for each row execute function public.touch_updated_at();

drop trigger if exists touch_transfer_limits_updated_at on public.transfer_limits;
create trigger touch_transfer_limits_updated_at before update on public.transfer_limits
for each row execute function public.touch_updated_at();

create or replace function public.is_bank_admin(profile_id uuid default auth.uid())
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = profile_id
      and role in ('bank_admin','super_admin')
      and status = 'active'
  );
$$;

create or replace function public.current_profile()
returns public.profiles
language sql
security definer
set search_path = public
as $$
  select * from public.profiles where id = auth.uid();
$$;

create or replace function public.generate_young_key(base_text text)
returns text
language plpgsql
as $$
declare
  cleaned text;
  candidate text;
begin
  cleaned := lower(regexp_replace(coalesce(base_text, 'young'), '[^a-zA-Z0-9]+', '', 'g'));
  if length(cleaned) < 3 then
    cleaned := 'young';
  end if;

  loop
    candidate := '@' || left(cleaned, 18) || floor(random() * 9000 + 1000)::text;
    exit when not exists (select 1 from public.profiles where young_key = candidate);
  end loop;

  return candidate;
end;
$$;

create or replace function public.create_profile_and_wallet(
  p_user_id uuid,
  p_email text,
  p_display_name text,
  p_avatar_url text
)
returns table(profile public.profiles, wallet public.wallets)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.profiles;
  v_wallet public.wallets;
begin
  insert into public.profiles (id, email, display_name, avatar_url, young_key, account_type, role, status)
  values (p_user_id, p_email, p_display_name, p_avatar_url, public.generate_young_key(split_part(p_email, '@', 1)), 'personal', 'common_user', 'active')
  on conflict (id) do update
    set email = excluded.email,
        display_name = coalesce(public.profiles.display_name, excluded.display_name),
        avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url)
  returning * into v_profile;

  insert into public.wallets (profile_id, wallet_type, status)
  values (p_user_id, 'personal', 'active')
  on conflict (profile_id) do update set updated_at = now()
  returning * into v_wallet;

  insert into public.audit_logs (actor_profile_id, action, entity_type, entity_id, after_data)
  values (p_user_id, 'profile.first_login_upserted', 'profile', p_user_id, to_jsonb(v_profile));

  return query select v_profile, v_wallet;
end;
$$;

create or replace function public.transfer_youngcoin_tx(
  p_actor_id uuid,
  p_to_young_key text,
  p_amount numeric,
  p_description text,
  p_idempotency_key text,
  p_ip_address text default null,
  p_user_agent text default null
)
returns public.transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor public.profiles;
  v_from public.wallets;
  v_to_profile public.profiles;
  v_to public.wallets;
  v_limit public.transfer_limits;
  v_daily_total numeric(18,2);
  v_minute_count integer;
  v_tx public.transactions;
begin
  select * into v_tx from public.transactions where idempotency_key = p_idempotency_key;
  if found then
    return v_tx;
  end if;

  if p_amount is null or p_amount <= 0 then
    insert into public.security_events(profile_id, event_type, severity, metadata) values (p_actor_id, 'transfer.invalid_amount', 'medium', jsonb_build_object('amount', p_amount));
    raise exception 'INVALID_AMOUNT';
  end if;

  select * into v_actor from public.profiles where id = p_actor_id and status = 'active';
  if not found then
    raise exception 'PROFILE_NOT_ACTIVE';
  end if;

  select * into v_from from public.wallets where profile_id = p_actor_id for update;
  if not found or v_from.status <> 'active' then
    insert into public.security_events(profile_id, event_type, severity, metadata) values (p_actor_id, 'transfer.origin_wallet_blocked', 'high', '{}');
    raise exception 'ORIGIN_WALLET_NOT_ACTIVE';
  end if;

  select * into v_to_profile from public.profiles where young_key = p_to_young_key and status = 'active';
  if not found then
    raise exception 'DESTINATION_NOT_FOUND';
  end if;

  select * into v_to from public.wallets where profile_id = v_to_profile.id for update;
  if not found or v_to.status <> 'active' then
    raise exception 'DESTINATION_WALLET_NOT_ACTIVE';
  end if;

  if v_from.id = v_to.id then
    insert into public.security_events(profile_id, event_type, severity, metadata) values (p_actor_id, 'transfer.self_transfer', 'medium', '{}');
    raise exception 'SELF_TRANSFER_BLOCKED';
  end if;

  select * into v_limit from public.transfer_limits where account_type = v_actor.account_type order by created_at desc limit 1;
  if p_amount > v_limit.transaction_limit then
    insert into public.security_events(profile_id, event_type, severity, metadata) values (p_actor_id, 'transfer.transaction_limit_exceeded', 'high', jsonb_build_object('amount', p_amount));
    raise exception 'TRANSACTION_LIMIT_EXCEEDED';
  end if;

  select coalesce(sum(amount), 0) into v_daily_total
  from public.transactions
  where from_wallet_id = v_from.id
    and status = 'completed'
    and type in ('transfer','payment')
    and created_at >= date_trunc('day', now());

  if v_daily_total + p_amount > v_limit.daily_limit then
    insert into public.security_events(profile_id, event_type, severity, metadata) values (p_actor_id, 'transfer.daily_limit_exceeded', 'high', jsonb_build_object('daily_total', v_daily_total, 'amount', p_amount));
    raise exception 'DAILY_LIMIT_EXCEEDED';
  end if;

  select count(*) into v_minute_count
  from public.transactions
  where from_wallet_id = v_from.id
    and created_at >= now() - interval '1 minute';

  if v_minute_count >= v_limit.minute_limit then
    insert into public.security_events(profile_id, event_type, severity, metadata) values (p_actor_id, 'transfer.rate_limited', 'medium', jsonb_build_object('minute_count', v_minute_count));
    raise exception 'RATE_LIMITED';
  end if;

  if v_from.balance < p_amount then
    insert into public.security_events(profile_id, event_type, severity, metadata) values (p_actor_id, 'transfer.insufficient_funds', 'medium', jsonb_build_object('balance', v_from.balance, 'amount', p_amount));
    raise exception 'INSUFFICIENT_FUNDS';
  end if;

  update public.wallets set balance = balance - p_amount where id = v_from.id;
  update public.wallets set balance = balance + p_amount where id = v_to.id;

  insert into public.transactions (idempotency_key, from_wallet_id, to_wallet_id, amount, type, status, description, metadata, created_by)
  values (p_idempotency_key, v_from.id, v_to.id, p_amount, 'transfer', 'completed', p_description, jsonb_build_object('to_young_key', p_to_young_key), p_actor_id)
  returning * into v_tx;

  insert into public.audit_logs (actor_profile_id, action, entity_type, entity_id, before_data, after_data, metadata, ip_address, user_agent)
  values (p_actor_id, 'transaction.transfer_completed', 'transaction', v_tx.id, null, to_jsonb(v_tx), jsonb_build_object('from_wallet_id', v_from.id, 'to_wallet_id', v_to.id), p_ip_address, p_user_agent);

  return v_tx;
end;
$$;

create or replace function public.reverse_transaction_tx(
  p_actor_id uuid,
  p_transaction_id uuid,
  p_reason text,
  p_idempotency_key text,
  p_ip_address text default null,
  p_user_agent text default null
)
returns public.transactions
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor public.profiles;
  v_original public.transactions;
  v_reversal public.transactions;
begin
  select * into v_actor from public.profiles where id = p_actor_id and role in ('bank_admin','super_admin') and status = 'active';
  if not found then
    raise exception 'FORBIDDEN';
  end if;

  select * into v_reversal from public.transactions where idempotency_key = p_idempotency_key;
  if found then
    return v_reversal;
  end if;

  select * into v_original from public.transactions where id = p_transaction_id for update;
  if not found or v_original.status <> 'completed' then
    raise exception 'TRANSACTION_NOT_REVERSIBLE';
  end if;

  update public.wallets set balance = balance + v_original.amount where id = v_original.from_wallet_id;
  update public.wallets set balance = balance - v_original.amount where id = v_original.to_wallet_id;
  update public.transactions set status = 'reversed' where id = v_original.id;

  insert into public.transactions (idempotency_key, from_wallet_id, to_wallet_id, amount, type, status, description, metadata, created_by, reversed_transaction_id)
  values (p_idempotency_key, v_original.to_wallet_id, v_original.from_wallet_id, v_original.amount, 'reversal', 'completed', p_reason, jsonb_build_object('original_transaction_id', v_original.id), p_actor_id, v_original.id)
  returning * into v_reversal;

  insert into public.audit_logs (actor_profile_id, action, entity_type, entity_id, before_data, after_data, metadata, ip_address, user_agent)
  values (p_actor_id, 'transaction.reversed', 'transaction', v_original.id, to_jsonb(v_original), to_jsonb(v_reversal), jsonb_build_object('reason', p_reason), p_ip_address, p_user_agent);

  return v_reversal;
end;
$$;

create or replace function public.block_wallet_tx(
  p_actor_id uuid,
  p_wallet_id uuid,
  p_status text,
  p_reason text,
  p_ip_address text default null,
  p_user_agent text default null
)
returns public.wallets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_before public.wallets;
  v_after public.wallets;
begin
  if not public.is_bank_admin(p_actor_id) then
    raise exception 'FORBIDDEN';
  end if;

  if p_status not in ('active','blocked','frozen') then
    raise exception 'INVALID_STATUS';
  end if;

  select * into v_before from public.wallets where id = p_wallet_id for update;
  if not found then
    raise exception 'WALLET_NOT_FOUND';
  end if;

  update public.wallets set status = p_status where id = p_wallet_id returning * into v_after;

  insert into public.audit_logs (actor_profile_id, action, entity_type, entity_id, before_data, after_data, metadata, ip_address, user_agent)
  values (p_actor_id, 'wallet.status_changed', 'wallet', p_wallet_id, to_jsonb(v_before), to_jsonb(v_after), jsonb_build_object('reason', p_reason), p_ip_address, p_user_agent);

  return v_after;
end;
$$;

alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;
alter table public.wallets enable row level security;
alter table public.transactions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.transfer_limits enable row level security;
alter table public.security_events enable row level security;

create policy "profiles read own or bank admin" on public.profiles for select using (id = auth.uid() or public.is_bank_admin());
create policy "profiles update own basic" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));

create policy "organizations read members or admin" on public.organizations for select using (
  public.is_bank_admin() or exists (select 1 from public.organization_members m where m.organization_id = organizations.id and m.profile_id = auth.uid())
);

create policy "organization members read own orgs or admin" on public.organization_members for select using (
  public.is_bank_admin() or profile_id = auth.uid() or exists (select 1 from public.organization_members m where m.organization_id = organization_members.organization_id and m.profile_id = auth.uid() and m.member_role = 'admin')
);
create policy "organization members insert bank admin" on public.organization_members for insert with check (public.is_bank_admin());
create policy "organization members update bank admin" on public.organization_members for update using (public.is_bank_admin()) with check (public.is_bank_admin());

create policy "wallets read own or bank admin" on public.wallets for select using (profile_id = auth.uid() or public.is_bank_admin());

create policy "transactions read participant or admin" on public.transactions for select using (
  public.is_bank_admin()
  or exists (select 1 from public.wallets w where w.profile_id = auth.uid() and (w.id = transactions.from_wallet_id or w.id = transactions.to_wallet_id))
);

create policy "audit logs read bank admin" on public.audit_logs for select using (public.is_bank_admin());
create policy "security events read bank admin" on public.security_events for select using (public.is_bank_admin());
create policy "transfer limits read authenticated" on public.transfer_limits for select using (auth.role() = 'authenticated');
create policy "transfer limits update bank admin" on public.transfer_limits for update using (public.is_bank_admin()) with check (public.is_bank_admin());

revoke insert, update, delete on public.transactions from anon, authenticated;
revoke update(balance) on public.wallets from anon, authenticated;
revoke delete on public.audit_logs from anon, authenticated;
revoke delete on public.security_events from anon, authenticated;
