-- Backend hardening for ledger safety, idempotency ownership and atomic organization creation.

create unique index if not exists idx_transactions_reversal_once
  on public.transactions(reversed_transaction_id)
  where type = 'reversal' and reversed_transaction_id is not null;

create index if not exists idx_transactions_created_by_idempotency
  on public.transactions(created_by, idempotency_key);

create index if not exists idx_wallets_organization_id
  on public.wallets(organization_id);

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
  if p_idempotency_key is null or length(trim(p_idempotency_key)) < 8 then
    raise exception 'INVALID_IDEMPOTENCY_KEY';
  end if;

  select * into v_tx from public.transactions where idempotency_key = p_idempotency_key;
  if found then
    if v_tx.created_by = p_actor_id and v_tx.type in ('transfer','payment') then
      return v_tx;
    end if;
    insert into public.security_events(profile_id, event_type, severity, metadata)
    values (p_actor_id, 'transfer.idempotency_key_conflict', 'high', jsonb_build_object('idempotency_key', p_idempotency_key));
    raise exception 'IDEMPOTENCY_KEY_CONFLICT';
  end if;

  if p_amount is null or p_amount <= 0 or p_amount <> round(p_amount, 2) then
    insert into public.security_events(profile_id, event_type, severity, metadata)
    values (p_actor_id, 'transfer.invalid_amount', 'medium', jsonb_build_object('amount', p_amount));
    raise exception 'INVALID_AMOUNT';
  end if;

  select * into v_actor from public.profiles where id = p_actor_id and status = 'active';
  if not found then
    raise exception 'PROFILE_NOT_ACTIVE';
  end if;

  select * into v_from from public.wallets where profile_id = p_actor_id and wallet_type = 'personal';
  if not found then
    raise exception 'ORIGIN_WALLET_NOT_FOUND';
  end if;

  select * into v_to_profile from public.profiles where young_key = lower(trim(p_to_young_key)) and status = 'active';
  if not found then
    raise exception 'DESTINATION_NOT_FOUND';
  end if;

  select * into v_to from public.wallets where profile_id = v_to_profile.id and wallet_type = 'personal';
  if not found then
    raise exception 'DESTINATION_WALLET_NOT_FOUND';
  end if;

  if v_from.id = v_to.id then
    insert into public.security_events(profile_id, event_type, severity, metadata)
    values (p_actor_id, 'transfer.self_transfer', 'medium', '{}');
    raise exception 'SELF_TRANSFER_BLOCKED';
  end if;

  perform 1
  from public.wallets
  where id in (v_from.id, v_to.id)
  order by id
  for update;

  select * into v_from from public.wallets where id = v_from.id;
  select * into v_to from public.wallets where id = v_to.id;

  if v_from.status <> 'active' then
    insert into public.security_events(profile_id, event_type, severity, metadata)
    values (p_actor_id, 'transfer.origin_wallet_blocked', 'high', jsonb_build_object('wallet_status', v_from.status));
    raise exception 'ORIGIN_WALLET_NOT_ACTIVE';
  end if;

  if v_to.status <> 'active' then
    insert into public.security_events(profile_id, event_type, severity, metadata)
    values (p_actor_id, 'transfer.destination_wallet_blocked', 'medium', jsonb_build_object('wallet_status', v_to.status));
    raise exception 'DESTINATION_WALLET_NOT_ACTIVE';
  end if;

  select * into v_limit from public.transfer_limits where account_type = v_actor.account_type order by created_at desc limit 1;
  if not found then
    raise exception 'TRANSFER_LIMIT_NOT_CONFIGURED';
  end if;

  if p_amount > v_limit.transaction_limit then
    insert into public.security_events(profile_id, event_type, severity, metadata)
    values (p_actor_id, 'transfer.transaction_limit_exceeded', 'high', jsonb_build_object('amount', p_amount));
    raise exception 'TRANSACTION_LIMIT_EXCEEDED';
  end if;

  select coalesce(sum(amount), 0) into v_daily_total
  from public.transactions
  where from_wallet_id = v_from.id
    and status = 'completed'
    and type in ('transfer','payment')
    and created_at >= date_trunc('day', now());

  if v_daily_total + p_amount > v_limit.daily_limit then
    insert into public.security_events(profile_id, event_type, severity, metadata)
    values (p_actor_id, 'transfer.daily_limit_exceeded', 'high', jsonb_build_object('daily_total', v_daily_total, 'amount', p_amount));
    raise exception 'DAILY_LIMIT_EXCEEDED';
  end if;

  select count(*) into v_minute_count
  from public.transactions
  where from_wallet_id = v_from.id
    and created_at >= now() - interval '1 minute';

  if v_minute_count >= v_limit.minute_limit then
    insert into public.security_events(profile_id, event_type, severity, metadata)
    values (p_actor_id, 'transfer.rate_limited', 'medium', jsonb_build_object('minute_count', v_minute_count));
    raise exception 'RATE_LIMITED';
  end if;

  if v_from.balance < p_amount then
    insert into public.security_events(profile_id, event_type, severity, metadata)
    values (p_actor_id, 'transfer.insufficient_funds', 'medium', jsonb_build_object('balance', v_from.balance, 'amount', p_amount));
    raise exception 'INSUFFICIENT_FUNDS';
  end if;

  update public.wallets set balance = balance - p_amount where id = v_from.id;
  update public.wallets set balance = balance + p_amount where id = v_to.id;

  insert into public.transactions (idempotency_key, from_wallet_id, to_wallet_id, amount, type, status, description, metadata, created_by)
  values (p_idempotency_key, v_from.id, v_to.id, p_amount, 'transfer', 'completed', nullif(trim(p_description), ''), jsonb_build_object('to_young_key', v_to_profile.young_key), p_actor_id)
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
  v_from public.wallets;
  v_to public.wallets;
begin
  select * into v_actor from public.profiles where id = p_actor_id and role in ('bank_admin','super_admin') and status = 'active';
  if not found then
    raise exception 'FORBIDDEN';
  end if;

  if p_idempotency_key is null or length(trim(p_idempotency_key)) < 8 then
    raise exception 'INVALID_IDEMPOTENCY_KEY';
  end if;

  select * into v_reversal from public.transactions where idempotency_key = p_idempotency_key;
  if found then
    if v_reversal.created_by = p_actor_id and v_reversal.type = 'reversal' and v_reversal.reversed_transaction_id = p_transaction_id then
      return v_reversal;
    end if;
    insert into public.security_events(profile_id, event_type, severity, metadata)
    values (p_actor_id, 'reversal.idempotency_key_conflict', 'high', jsonb_build_object('idempotency_key', p_idempotency_key, 'transaction_id', p_transaction_id));
    raise exception 'IDEMPOTENCY_KEY_CONFLICT';
  end if;

  select * into v_original from public.transactions where id = p_transaction_id for update;
  if not found or v_original.status <> 'completed' or v_original.type not in ('transfer','payment') then
    raise exception 'TRANSACTION_NOT_REVERSIBLE';
  end if;

  if exists (select 1 from public.transactions where reversed_transaction_id = v_original.id and type = 'reversal') then
    raise exception 'TRANSACTION_ALREADY_REVERSED';
  end if;

  perform 1
  from public.wallets
  where id in (v_original.from_wallet_id, v_original.to_wallet_id)
  order by id
  for update;

  select * into v_from from public.wallets where id = v_original.from_wallet_id;
  select * into v_to from public.wallets where id = v_original.to_wallet_id;

  if v_from.id is null or v_to.id is null then
    raise exception 'REVERSAL_WALLET_NOT_FOUND';
  end if;

  if v_to.balance < v_original.amount then
    insert into public.security_events(profile_id, event_type, severity, metadata)
    values (p_actor_id, 'reversal.insufficient_destination_funds', 'high', jsonb_build_object('transaction_id', v_original.id, 'wallet_id', v_to.id, 'balance', v_to.balance, 'amount', v_original.amount));
    raise exception 'REVERSAL_INSUFFICIENT_FUNDS';
  end if;

  update public.wallets set balance = balance + v_original.amount where id = v_original.from_wallet_id;
  update public.wallets set balance = balance - v_original.amount where id = v_original.to_wallet_id;
  update public.transactions set status = 'reversed' where id = v_original.id;

  insert into public.transactions (idempotency_key, from_wallet_id, to_wallet_id, amount, type, status, description, metadata, created_by, reversed_transaction_id)
  values (p_idempotency_key, v_original.to_wallet_id, v_original.from_wallet_id, v_original.amount, 'reversal', 'completed', nullif(trim(p_reason), ''), jsonb_build_object('original_transaction_id', v_original.id), p_actor_id, v_original.id)
  returning * into v_reversal;

  insert into public.audit_logs (actor_profile_id, action, entity_type, entity_id, before_data, after_data, metadata, ip_address, user_agent)
  values (p_actor_id, 'transaction.reversed', 'transaction', v_original.id, to_jsonb(v_original), to_jsonb(v_reversal), jsonb_build_object('reason', p_reason), p_ip_address, p_user_agent);

  return v_reversal;
end;
$$;

create or replace function public.create_organization_account_tx(
  p_actor_id uuid,
  p_name text,
  p_slug text,
  p_owner_profile_id uuid default null,
  p_ip_address text default null,
  p_user_agent text default null
)
returns table(organization public.organizations, business_wallet public.wallets)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org public.organizations;
  v_wallet public.wallets;
  v_slug text;
begin
  if not public.is_bank_admin(p_actor_id) then
    raise exception 'FORBIDDEN';
  end if;

  if p_name is null or length(trim(p_name)) < 2 then
    raise exception 'INVALID_ORGANIZATION_NAME';
  end if;

  if p_slug is null then
    raise exception 'INVALID_ORGANIZATION_SLUG';
  end if;

  v_slug := lower(regexp_replace(trim(p_slug), '[^a-zA-Z0-9_-]+', '-', 'g'));
  if length(v_slug) < 2 then
    raise exception 'INVALID_ORGANIZATION_SLUG';
  end if;

  if p_owner_profile_id is not null and not exists (select 1 from public.profiles where id = p_owner_profile_id and status = 'active') then
    raise exception 'OWNER_PROFILE_NOT_ACTIVE';
  end if;

  insert into public.organizations (name, slug, owner_profile_id, status)
  values (trim(p_name), v_slug, p_owner_profile_id, 'active')
  returning * into v_org;

  insert into public.wallets (profile_id, organization_id, wallet_type, status)
  values (null, v_org.id, 'business', 'active')
  returning * into v_wallet;

  if p_owner_profile_id is not null then
    insert into public.organization_members (organization_id, profile_id, member_role, status)
    values (v_org.id, p_owner_profile_id, 'admin', 'active')
    on conflict (organization_id, profile_id) do update
      set member_role = 'admin',
          status = 'active';
  end if;

  insert into public.audit_logs (actor_profile_id, action, entity_type, entity_id, after_data, metadata, ip_address, user_agent)
  values (p_actor_id, 'organization.created', 'organization', v_org.id, to_jsonb(v_org), jsonb_build_object('business_wallet_id', v_wallet.id, 'owner_profile_id', p_owner_profile_id), p_ip_address, p_user_agent);

  return query select v_org, v_wallet;
end;
$$;

drop policy if exists "wallets read own or bank admin" on public.wallets;
create policy "wallets read own orgs or bank admin" on public.wallets for select using (
  profile_id = auth.uid()
  or public.is_bank_admin()
  or exists (
    select 1
    from public.organization_members m
    where m.organization_id = wallets.organization_id
      and m.profile_id = auth.uid()
      and m.status = 'active'
  )
);
