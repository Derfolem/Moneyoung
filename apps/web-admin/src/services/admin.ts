"use client";

import type {
  AccountType,
  LedgerTransaction,
  Profile,
  ProfileRole,
  ProfileStatus,
  SecuritySeverity,
  TransactionStatus,
  TransactionType,
  Wallet,
  WalletStatus
} from "@moneyoung/shared";
import { isSupabaseConfigured, supabase, supabaseConfigMessage } from "./supabase";

export type AdminProfile = Pick<Profile, "id" | "email" | "display_name" | "role" | "status">;

export type Organization = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  invite_code_student: string | null;
  invite_code_staff: string | null;
  access_pin: string | null;
  owner_profile_id: string | null;
  status: ProfileStatus;
  created_at: string;
  updated_at: string;
};

export type OrganizationMemberRole = "student" | "teacher" | "staff" | "admin";

export type TransferLimit = {
  id: string;
  account_type: AccountType;
  daily_limit: string;
  transaction_limit: string;
  minute_limit: number;
  created_at: string;
  updated_at: string;
};

export type AuditLog = {
  id: string;
  actor_profile_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  metadata: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
};

export type SecurityEvent = {
  id: string;
  profile_id: string | null;
  event_type: string;
  severity: SecuritySeverity;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type DashboardSummary = {
  current_value: number;
  active_students: number;
  active_schools: number;
  transactions_today: number;
  transactions_month: number;
  transactions_year: number;
  total_reversals: number;
  total_wallets: number;
  blocked_wallets: number;
  critical_events: number;
  transactions_by_day: Record<string, number>;
  latest_transactions: LedgerTransaction[];
};

export type AccountsFilters = {
  query?: string;
  role?: ProfileRole | "";
  status?: ProfileStatus | "";
};

export type EnrichedWallet = {
  id: string;
  profile_id: string;
  owner_name: string | null;
  owner_young_key: string | null;
  owner_account_type: AccountType | null;
  organization_id: string | null;
  organization_name: string | null;
  wallet_type: string;
  balance: string;
  status: WalletStatus;
  created_at: string;
  updated_at: string;
};

export type WalletFilters = {
  status?: WalletStatus | "";
  query?: string;
};

export type TransactionFilters = {
  status?: TransactionStatus | "";
  type?: TransactionType | "";
  min?: string;
  max?: string;
  walletId?: string;
};

export type AuditFilters = {
  action?: string;
  entityType?: string;
};

export type SecurityFilters = {
  severity?: SecuritySeverity | "";
};

export async function invokeFunction<T>(name: string, body?: Record<string, unknown>): Promise<T> {
  if (!isSupabaseConfigured) throw new Error(supabaseConfigMessage);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData?.session?.access_token) {
    const { data: refreshed } = await supabase.auth.refreshSession();
    sessionData = { session: refreshed.session };
  }
  const accessToken = sessionData?.session?.access_token;
  if (!accessToken) throw new Error("Sessão expirada. Faça login novamente.");
  const res = await fetch(`${url}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": anonKey!,
      "Authorization": `Bearer ${accessToken}`
    },
    ...(body ? { body: JSON.stringify(body) } : {})
  });
  const json = await res.json();
  if (!res.ok) {
    const raw = json?.error?.message ?? json?.message ?? "Erro inesperado.";
    throw new Error(raw);
  }
  return json as T;
}

export async function requireAdminSession(): Promise<AdminProfile | null> {
  if (!isSupabaseConfigured) return null;
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) throw new Error(sessionError.message);
  if (!sessionData.session) return null;
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id,email,display_name,role,status")
    .eq("id", sessionData.session.user.id)
    .single();
  if (error) throw new Error(error.message);
  if (!profile || profile.status !== "active" || !["bank_admin", "super_admin"].includes(profile.role)) return null;
  return profile as AdminProfile;
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  return invokeFunction<DashboardSummary>("admin_dashboard_summary");
}

export async function listAccounts(filters: AccountsFilters): Promise<Profile[]> {
  let request = supabase
    .from("profiles")
    .select("id,email,display_name,avatar_url,young_key,account_type,role,status,created_at,updated_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const query = cleanSearch(filters.query);
  if (query) request = request.or(`email.ilike.%${query}%,young_key.ilike.%${query}%,display_name.ilike.%${query}%`);
  if (filters.role) request = request.eq("role", filters.role);
  if (filters.status) request = request.eq("status", filters.status);

  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return (data ?? []) as Profile[];
}

export async function listWallets(filters: WalletFilters): Promise<EnrichedWallet[]> {
  let request = supabase
    .from("enriched_wallets")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  const query = cleanSearch(filters.query);
  if (filters.status) request = request.eq("status", filters.status);
  if (query) request = request.or(`id.eq.${query},profile_id.eq.${query},owner_name.ilike.%${query}%,owner_young_key.ilike.%${query}%`);

  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return (data ?? []) as EnrichedWallet[];
}

export async function changeWalletStatus(walletId: string, status: WalletStatus, reason: string): Promise<Wallet> {
  const response = await invokeFunction<{ wallet: Wallet }>("block_wallet", {
    wallet_id: walletId,
    status,
    reason
  });
  return response.wallet;
}

export async function listTransactions(filters: TransactionFilters): Promise<LedgerTransaction[]> {
  let request = supabase.from("enriched_transactions").select("*").order("created_at", { ascending: false }).limit(300);
  if (filters.status) request = request.eq("status", filters.status);
  if (filters.type) request = request.eq("type", filters.type);
  if (filters.min) request = request.gte("amount", Number(filters.min));
  if (filters.max) request = request.lte("amount", Number(filters.max));
  const walletId = cleanSearch(filters.walletId);
  if (walletId) request = request.or(`from_wallet_id.eq.${walletId},to_wallet_id.eq.${walletId}`);

  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return (data ?? []) as LedgerTransaction[];
}

export async function getTransaction(id: string): Promise<LedgerTransaction | null> {
  const { data, error } = await supabase.from("enriched_transactions").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as LedgerTransaction | null;
}

export async function reverseTransaction(transactionId: string, reason: string, idempotencyKey: string): Promise<LedgerTransaction> {
  const response = await invokeFunction<{ transaction: LedgerTransaction }>("reverse_transaction", {
    transaction_id: transactionId,
    reason,
    idempotency_key: idempotencyKey
  });
  return response.transaction;
}

export async function listOrganizations(): Promise<Organization[]> {
  const { data, error } = await supabase.from("organizations").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as Organization[];
}

export type CreateOrgResult = {
  organization: Organization;
  business_wallet: unknown;
  invite_code_student: string;
  invite_code_staff: string;
};

export async function createOrganization(name: string, slug: string, email?: string, ownerProfileId?: string): Promise<CreateOrgResult> {
  return invokeFunction<CreateOrgResult>("create_organization_account", {
    name,
    slug,
    email: email || undefined,
    owner_profile_id: ownerProfileId || undefined
  });
}

export async function linkOrganizationMember(
  organizationId: string,
  youngKeyOrId: string,
  memberRole: OrganizationMemberRole
): Promise<void> {
  let profileId = youngKeyOrId;

  if (youngKeyOrId.startsWith("@")) {
    const { data, error: lookupError } = await supabase
      .from("profiles")
      .select("id")
      .eq("young_key", youngKeyOrId)
      .maybeSingle();
    if (lookupError) throw new Error(lookupError.message);
    if (!data) throw new Error(`Usuário com chave "${youngKeyOrId}" não encontrado.`);
    profileId = data.id;
  }

  const { error } = await supabase.from("organization_members").insert({
    organization_id: organizationId,
    profile_id: profileId,
    member_role: memberRole,
    status: "active"
  });
  if (error) throw new Error(error.message);
}

export type OrgMember = {
  id: string;
  organization_id: string;
  profile_id: string;
  member_role: string;
  status: string;
  created_at: string;
  display_name: string | null;
  young_key: string | null;
  account_type: string | null;
};

export async function listOrgMembers(organizationId: string): Promise<OrgMember[]> {
  const { data, error } = await supabase
    .from("organization_members")
    .select("id,organization_id,profile_id,member_role,status,created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const members = (data ?? []) as Array<{
    id: string; organization_id: string; profile_id: string;
    member_role: string; status: string; created_at: string;
  }>;

  if (members.length === 0) return [];

  const profileIds = members.map(m => m.profile_id);
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id,display_name,young_key,account_type")
    .in("id", profileIds);

  const profileMap = new Map((profiles ?? []).map(p => [p.id, p]));

  return members.map(m => {
    const p = profileMap.get(m.profile_id);
    return {
      ...m,
      display_name: p?.display_name ?? null,
      young_key: p?.young_key ?? null,
      account_type: p?.account_type ?? null,
    };
  });
}

export async function unlinkOrgMember(memberId: string): Promise<void> {
  const { error } = await supabase.from("organization_members").delete().eq("id", memberId);
  if (error) throw new Error(error.message);
}

export async function deleteOrganization(orgId: string): Promise<void> {
  const { error: membersError } = await supabase
    .from("organization_members")
    .delete()
    .eq("organization_id", orgId);
  if (membersError) throw new Error(membersError.message);

  const { error: walletsError } = await supabase
    .from("wallets")
    .delete()
    .eq("organization_id", orgId);
  if (walletsError) throw new Error(walletsError.message);

  const { error } = await supabase.from("organizations").delete().eq("id", orgId);
  if (error) throw new Error(error.message);
}

export async function listAuditLogs(filters: AuditFilters): Promise<AuditLog[]> {
  let request = supabase.from("audit_logs").select("*").order("created_at", { ascending: false }).limit(300);
  const action = cleanSearch(filters.action);
  const entityType = cleanSearch(filters.entityType);
  if (action) request = request.ilike("action", `%${action}%`);
  if (entityType) request = request.eq("entity_type", entityType);

  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return (data ?? []) as AuditLog[];
}

export async function listTransactionAuditLogs(transactionId: string): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*")
    .eq("entity_id", transactionId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as AuditLog[];
}

export async function listSecurityEvents(filters: SecurityFilters): Promise<SecurityEvent[]> {
  let request = supabase.from("security_events").select("*").order("created_at", { ascending: false }).limit(300);
  if (filters.severity) request = request.eq("severity", filters.severity);
  const { data, error } = await request;
  if (error) throw new Error(error.message);
  return (data ?? []) as SecurityEvent[];
}

export async function listTransferLimits(): Promise<TransferLimit[]> {
  const { data, error } = await supabase.from("transfer_limits").select("*").order("account_type");
  if (error) throw new Error(error.message);
  return (data ?? []) as TransferLimit[];
}

export async function updateTransferLimit(
  id: string,
  values: Pick<TransferLimit, "daily_limit" | "transaction_limit" | "minute_limit">
): Promise<void> {
  const { error } = await supabase
    .from("transfer_limits")
    .update({
      daily_limit: Number(values.daily_limit),
      transaction_limit: Number(values.transaction_limit),
      minute_limit: Number(values.minute_limit)
    })
    .eq("id", id);
  if (error) throw new Error(error.message);
}

export function exportCsv(filename: string, rows: Record<string, unknown>[]) {
  const keys = Object.keys(rows[0] ?? {});
  if (!keys.length) return;
  const csv = [keys.join(","), ...rows.map((row) => keys.map((key) => JSON.stringify(row[key] ?? "")).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function toCsvRows<T extends Record<string, unknown>>(rows: T[]): Record<string, unknown>[] {
  return rows.map((row) => ({ ...row }));
}

export type PendingRegistration = {
  id: string;
  email: string;
  display_name: string;
  full_name: string | null;
  young_key: string;
  account_type: string;
  status: string;
  birth_date: string | null;
  invited_by_org_id: string | null;
  created_at: string;
  organization_name?: string;
};

export async function listPendingRegistrations(): Promise<PendingRegistration[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,display_name,full_name,young_key,account_type,status,birth_date,invited_by_org_id,created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const profiles = (data ?? []) as PendingRegistration[];
  if (profiles.length === 0) return [];

  const orgIds = [...new Set(profiles.map(p => p.invited_by_org_id).filter(Boolean))] as string[];
  if (orgIds.length > 0) {
    const { data: orgs } = await supabase.from("organizations").select("id,name").in("id", orgIds);
    const orgMap = new Map((orgs ?? []).map(o => [o.id, o.name]));
    for (const p of profiles) {
      if (p.invited_by_org_id) p.organization_name = orgMap.get(p.invited_by_org_id) ?? undefined;
    }
  }
  return profiles;
}

export async function approveRegistration(profileId: string, approved: boolean, reason?: string): Promise<void> {
  await invokeFunction("approve_registration", {
    profile_id: profileId,
    approved,
    reason: reason || undefined
  });
}

export async function creditOrgWallet(orgId: string, amount: number, description: string): Promise<void> {
  const { data: wallet, error: wErr } = await supabase
    .from("wallets")
    .select("id")
    .eq("organization_id", orgId)
    .eq("wallet_type", "business")
    .maybeSingle();
  if (wErr || !wallet) throw new Error("Wallet da escola nao encontrada.");

  const session = await supabase.auth.getSession();
  const actorId = session.data.session?.user.id;
  if (!actorId) throw new Error("Sessao expirada.");

  await invokeFunction("admin_credit_wallet", {
    wallet_id: wallet.id,
    amount,
    description: description || "Credito do banco para escola",
  });
}

export async function updateOrgAccessPin(orgId: string, pin: string): Promise<void> {
  const { error } = await supabase
    .from("organizations")
    .update({ access_pin: pin })
    .eq("id", orgId);
  if (error) throw new Error(error.message);
}

export async function updateMemberRole(memberId: string, newRole: OrganizationMemberRole): Promise<void> {
  const { error } = await supabase
    .from("organization_members")
    .update({ member_role: newRole })
    .eq("id", memberId);
  if (error) throw new Error(error.message);
}

export type CancellationRequest = {
  id: string;
  email: string;
  display_name: string;
  full_name: string | null;
  young_key: string;
  account_type: string;
  status: string;
  cancellation_requested_at: string;
  invited_by_org_id: string | null;
  organization_name?: string;
};

export async function listCancellationRequests(): Promise<CancellationRequest[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,display_name,full_name,young_key,account_type,status,cancellation_requested_at,invited_by_org_id")
    .not("cancellation_requested_at", "is", null)
    .order("cancellation_requested_at", { ascending: false });
  if (error) throw new Error(error.message);

  const rows = (data ?? []) as CancellationRequest[];
  if (rows.length === 0) return [];

  const orgIds = [...new Set(rows.map(r => r.invited_by_org_id).filter(Boolean))] as string[];
  if (orgIds.length > 0) {
    const { data: orgs } = await supabase.from("organizations").select("id,name").in("id", orgIds);
    const orgMap = new Map((orgs ?? []).map(o => [o.id, o.name]));
    for (const r of rows) {
      if (r.invited_by_org_id) r.organization_name = orgMap.get(r.invited_by_org_id) ?? undefined;
    }
  }
  return rows;
}

export async function processCancellation(profileId: string, approved: boolean): Promise<void> {
  await invokeFunction("process_cancellation", { profile_id: profileId, approved });
}

export async function reactivateAccount(profileId: string): Promise<void> {
  const { error } = await supabase
    .from("profiles")
    .update({ status: "active", cancellation_requested_at: null })
    .eq("id", profileId);
  if (error) throw new Error(error.message);

  await supabase
    .from("wallets")
    .update({ status: "active" })
    .eq("profile_id", profileId)
    .eq("status", "blocked");
}

function cleanSearch(value?: string): string {
  return (value ?? "").trim().replace(/[%*,()\\]/g, "");
}

