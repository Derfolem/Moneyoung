import { createIdempotencyKey, LedgerTransaction, TransferPayload, WalletSummary } from "@moneyoung/shared";
import { isSupabaseConfigured, supabase, supabaseConfigMessage } from "./supabase";

const demoWalletId = "demo-wallet";
let demoBalance = 5000;
const demoTransactions: LedgerTransaction[] = [
  {
    id: "demo-tx-4",
    idempotency_key: "demo_transfer_4",
    from_wallet_id: "wallet-professor",
    to_wallet_id: demoWalletId,
    amount: "120",
    type: "transfer",
    status: "completed",
    description: "Premio hackathon escolar",
    metadata: { mode: "demo" },
    created_by: "professor-user",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    reversed_transaction_id: null,
    from_display_name: "Prof. Silva",
    from_young_key: "@SUBEMP-silva2341",
    from_account_type: "sub_business",
    from_role: "organization_admin",
    to_display_name: "Miguel Aires",
    to_young_key: "@ALN-miguel1234",
    to_account_type: "personal",
    to_role: "common_user",
  },
  {
    id: "demo-tx-3",
    idempotency_key: "demo_payment_3",
    from_wallet_id: demoWalletId,
    to_wallet_id: "wallet-cantina",
    amount: "35",
    type: "payment",
    status: "completed",
    description: "Cantina escolar",
    metadata: { mode: "demo" },
    created_by: "demo-user",
    created_at: new Date(Date.now() - 7200000).toISOString(),
    reversed_transaction_id: null,
    from_display_name: "Miguel Aires",
    from_young_key: "@ALN-miguel1234",
    from_account_type: "personal",
    from_role: "common_user",
    to_display_name: "Cantina Escola",
    to_young_key: "@EMP-cantina5678",
    to_account_type: "business",
    to_role: "organization_admin",
  },
  {
    id: "demo-tx-2",
    idempotency_key: "demo_transfer_2",
    from_wallet_id: demoWalletId,
    to_wallet_id: "wallet-colega",
    amount: "50",
    type: "transfer",
    status: "completed",
    description: "Material didatico",
    metadata: { mode: "demo" },
    created_by: "demo-user",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    reversed_transaction_id: null,
    from_display_name: "Miguel Aires",
    from_young_key: "@ALN-miguel1234",
    from_account_type: "personal",
    from_role: "common_user",
    to_display_name: "Ana Costa",
    to_young_key: "@ALN-anacosta9012",
    to_account_type: "personal",
    to_role: "common_user",
  },
  {
    id: "demo-tx-1",
    idempotency_key: "demo_transfer_1",
    from_wallet_id: "wallet-escola",
    to_wallet_id: demoWalletId,
    amount: "200",
    type: "transfer",
    status: "completed",
    description: "Mesada educacional",
    metadata: { mode: "demo" },
    created_by: "escola-admin",
    created_at: new Date(Date.now() - 172800000).toISOString(),
    reversed_transaction_id: null,
    from_display_name: "Colegio VemCer",
    from_young_key: "@EMP-vemcer3456",
    from_account_type: "business",
    from_role: "organization_admin",
    to_display_name: "Miguel Aires",
    to_young_key: "@ALN-miguel1234",
    to_account_type: "personal",
    to_role: "common_user",
  },
  {
    id: "demo-initial-credit",
    idempotency_key: "demo_initial_credit",
    from_wallet_id: null,
    to_wallet_id: demoWalletId,
    amount: "5000",
    type: "initial_credit",
    status: "completed",
    description: "Credito inicial",
    metadata: { mode: "demo" },
    created_by: "demo-user",
    created_at: new Date(Date.now() - 604800000).toISOString(),
    reversed_transaction_id: null,
    from_display_name: null,
    from_young_key: null,
    from_account_type: null,
    from_role: null,
    to_display_name: "Miguel Aires",
    to_young_key: "@ALN-miguel1234",
    to_account_type: "personal",
    to_role: "common_user",
  },
];

function getDemoSummary(): WalletSummary {
  return {
    profile: {
      id: "demo-user",
      email: "miguel@moneyoung.edu.br",
      display_name: "Miguel Aires",
      avatar_url: null,
      young_key: "@miguel.aires",
      account_type: "personal",
      role: "common_user",
      status: "active",
    },
    wallet: {
      id: demoWalletId,
      balance: String(demoBalance),
      status: "active",
      wallet_type: "personal",
    },
    recent_transactions: demoTransactions,
  };
}

function validateTransferPayload(payload: Omit<TransferPayload, "idempotency_key">) {
  const toYoungKey = payload.to_young_key.trim();
  const amount = Number(payload.amount);

  if (!toYoungKey) throw new Error("Informe a chave Moneyoung de destino.");
  if (!Number.isFinite(amount) || amount <= 0) throw new Error("Informe um valor maior que zero.");

  return {
    to_young_key: toYoungKey,
    amount,
    description: payload.description?.trim() || undefined,
  };
}

const errorMessages: Record<string, string> = {
  INSUFFICIENT_FUNDS: "Saldo insuficiente.",
  DESTINATION_NOT_FOUND: "Destinatario nao encontrado. Verifique a chave Moneyoung.",
  DESTINATION_WALLET_NOT_FOUND: "Carteira do destinatario nao encontrada.",
  DESTINATION_WALLET_NOT_ACTIVE: "Carteira do destinatario esta bloqueada.",
  ORIGIN_WALLET_NOT_FOUND: "Sua carteira nao foi encontrada.",
  ORIGIN_WALLET_NOT_ACTIVE: "Sua carteira esta bloqueada.",
  SELF_TRANSFER_BLOCKED: "Voce nao pode transferir para si mesmo.",
  TRANSACTION_LIMIT_EXCEEDED: "Valor acima do limite por transacao.",
  DAILY_LIMIT_EXCEEDED: "Limite diario de transferencias atingido.",
  RATE_LIMITED: "Muitas transferencias em pouco tempo. Aguarde alguns segundos.",
  INVALID_AMOUNT: "Valor invalido.",
  PROFILE_NOT_ACTIVE: "Sua conta esta inativa.",
  IDEMPOTENCY_KEY_CONFLICT: "Essa transacao ja foi processada.",
  INVALID_IDEMPOTENCY_KEY: "Erro interno. Tente novamente.",
  TRANSFER_LIMIT_NOT_CONFIGURED: "Limite de transferencia nao configurado. Contate o administrador.",
  FORBIDDEN: "Voce nao tem permissao para esta acao.",
  INVITE_REQUIRED: "Cadastro requer codigo convite. Solicite o codigo da sua escola.",
};

function translateError(raw: string): string {
  const key = raw.trim().toUpperCase().replace(/\s+/g, "_");
  if (errorMessages[key]) return errorMessages[key];
  for (const [code, msg] of Object.entries(errorMessages)) {
    if (raw.toUpperCase().includes(code)) return msg;
  }
  return raw;
}

export function parseAmount(value: string) {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  return Number(normalized);
}

async function invoke<T>(name: string, body?: Record<string, unknown>): Promise<T> {
  if (!isSupabaseConfigured) throw new Error(supabaseConfigMessage);

  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData?.session?.access_token;

  const res = await fetch(`${url}/functions/v1/${name}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": anonKey!,
      "Authorization": `Bearer ${accessToken ?? anonKey}`,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const json = await res.json();

  if (!res.ok) {
    const raw = json?.error?.message ?? json?.message ?? "Erro inesperado. Tente novamente.";
    throw new Error(translateError(raw));
  }

  return json as T;
}

export async function ensureProfile() {
  if (!isSupabaseConfigured) return getDemoSummary().profile;
  return invoke("create_profile_on_first_login");
}

export type InviteValidation = {
  valid: boolean;
  organization_id?: string;
  organization_name?: string;
  code_type?: "student" | "staff";
};

export async function validateInviteCode(code: string): Promise<InviteValidation> {
  if (!isSupabaseConfigured) throw new Error(supabaseConfigMessage);
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  const res = await fetch(`${url}/functions/v1/validate_invite`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "apikey": anonKey! },
    body: JSON.stringify({ code: code.trim() }),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json?.error?.message ?? "Codigo invalido.");
  return json as InviteValidation;
}

export type RegisterData = {
  invite_code: string;
  full_name: string;
  birth_date: string;
  country?: string | undefined;
  state?: string | undefined;
  city?: string | undefined;
  sport?: string | undefined;
  about?: string | undefined;
  hobby?: string | undefined;
};

export async function registerWithInvite(data: RegisterData) {
  return invoke("register_with_invite", data as unknown as Record<string, unknown>);
}

export async function getOrgWalletSummary() {
  return invoke<{
    organization: { id: string; name: string; email: string | null; access_pin: string | null };
    wallet: { id: string; balance: string; status: string };
    member_role: string;
    recent_transactions: WalletSummary["recent_transactions"];
    members: Array<{
      profile_id: string; display_name: string; full_name: string | null;
      young_key: string; balance: number; member_role: string; status: string;
    }>;
  }>("org_wallet_summary");
}

export async function transferFromOrg(payload: Omit<TransferPayload, "idempotency_key">) {
  const nextPayload = validateTransferPayload(payload);
  return invoke("transfer_from_org", {
    ...nextPayload,
    idempotency_key: createIdempotencyKey("mobile_org_transfer"),
  });
}

export type SchoolContact = {
  profile_id: string;
  display_name: string;
  young_key: string;
  member_role: string;
};

export async function getSchoolContacts(): Promise<{
  contacts: SchoolContact[];
  recent_contacts: SchoolContact[];
  account_type: string;
}> {
  if (!isSupabaseConfigured) return { contacts: [], recent_contacts: [], account_type: "personal" };
  return invoke("get_school_contacts");
}

export async function requestCancellation(reason?: string) {
  return invoke("request_cancellation", reason ? { reason } : {});
}

export async function getWalletSummary(): Promise<WalletSummary> {
  if (!isSupabaseConfigured) return getDemoSummary();
  return invoke<WalletSummary>("get_wallet_summary");
}

async function moveMoneyoung(payload: Omit<TransferPayload, "idempotency_key">, type: "transfer" | "payment") {
  const nextPayload = validateTransferPayload(payload);

  if (!isSupabaseConfigured) {
    if (nextPayload.amount > demoBalance) throw new Error("Saldo demo insuficiente.");

    const idempotencyKey = createIdempotencyKey(`demo_${type}`);
    demoBalance -= nextPayload.amount;
    demoTransactions.unshift({
      id: idempotencyKey,
      idempotency_key: idempotencyKey,
      from_wallet_id: demoWalletId,
      to_wallet_id: "demo-destination-wallet",
      amount: String(nextPayload.amount),
      type,
      status: "completed",
      description: nextPayload.description || `${type === "payment" ? "Pagamento" : "Envio"} para ${nextPayload.to_young_key}`,
      metadata: { mode: "demo", to_young_key: nextPayload.to_young_key },
      created_by: "demo-user",
      created_at: new Date().toISOString(),
      reversed_transaction_id: null,
      from_display_name: "Miguel Aires",
      from_young_key: "@ALN-miguel1234",
      from_account_type: "personal",
      from_role: "common_user",
      to_display_name: null,
      to_young_key: nextPayload.to_young_key,
      to_account_type: "personal",
      to_role: "common_user",
    });
    return { ok: true, mode: "demo" };
  }

  return invoke("transfer_youngcoin", {
    ...nextPayload,
    idempotency_key: createIdempotencyKey("mobile_transfer"),
  });
}

export async function transferMoneyoung(payload: Omit<TransferPayload, "idempotency_key">) {
  return moveMoneyoung(payload, "transfer");
}

export async function payMoneyoung(payload: Omit<TransferPayload, "idempotency_key">) {
  return moveMoneyoung(payload, "payment");
}

export async function reportError(params: {
  screen: string;
  action: string;
  error_code?: string;
  error_message: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  if (!isSupabaseConfigured) return;
  try {
    const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
    const { data: sessionData } = await supabase.auth.getSession();
    const profileId = sessionData?.session?.user?.id ?? undefined;
    await fetch(`${url}/functions/v1/report_client_error`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": anonKey!,
        "Authorization": `Bearer ${anonKey}`,
      },
      body: JSON.stringify({
        ...params,
        profile_id: profileId,
        platform: "mobile",
      }),
    });
  } catch {
    // Silencioso — não interrompe o fluxo do usuário
  }
}
