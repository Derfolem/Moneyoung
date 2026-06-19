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

export function parseAmount(value: string) {
  const normalized = value.trim().replace(/\./g, "").replace(",", ".");
  return Number(normalized);
}

async function invoke<T>(name: string, body?: Record<string, unknown>): Promise<T> {
  if (!isSupabaseConfigured) throw new Error(supabaseConfigMessage);
  const { data, error } = await supabase.functions.invoke<T>(name, body ? { body } : {});
  if (error) throw new Error(error.message);
  return data as T;
}

export async function ensureProfile() {
  if (!isSupabaseConfigured) return getDemoSummary().profile;
  return invoke("create_profile_on_first_login");
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
