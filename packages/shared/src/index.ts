export type AccountType = "personal" | "business" | "sub_business" | "system";
export type ProfileRole = "common_user" | "organization_admin" | "bank_admin" | "super_admin";
export type ProfileStatus = "active" | "blocked" | "pending" | "deleted";
export type WalletStatus = "active" | "blocked" | "frozen" | "pending" | "deleted";
export type TransactionType = "transfer" | "payment" | "reversal" | "initial_credit" | "admin_adjustment";
export type TransactionStatus = "pending" | "completed" | "failed" | "reversed";
export type SecuritySeverity = "low" | "medium" | "high" | "critical";

export type Profile = {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  young_key: string;
  account_type: AccountType;
  role: ProfileRole;
  status: ProfileStatus;
  created_at: string;
  updated_at: string;
};

export type Wallet = {
  id: string;
  profile_id: string;
  organization_id: string | null;
  wallet_type: AccountType;
  balance: string;
  status: WalletStatus;
  created_at: string;
  updated_at: string;
};

export type LedgerTransaction = {
  id: string;
  idempotency_key: string;
  from_wallet_id: string | null;
  to_wallet_id: string | null;
  amount: string;
  type: TransactionType;
  status: TransactionStatus;
  description: string | null;
  metadata: Record<string, unknown>;
  created_by: string | null;
  created_at: string;
  reversed_transaction_id: string | null;
  from_display_name: string | null;
  from_young_key: string | null;
  from_account_type: AccountType | null;
  from_role: string | null;
  to_display_name: string | null;
  to_young_key: string | null;
  to_account_type: AccountType | null;
  to_role: string | null;
  created_by_display_name: string | null;
  created_by_young_key: string | null;
  created_by_account_type: AccountType | null;
};

export const accountTypeLabels: Record<AccountType, string> = {
  personal: "Aluno",
  business: "Empresa",
  sub_business: "Professor",
  system: "Administrador",
};

export type WalletSummary = {
  profile: Pick<Profile, "id" | "email" | "display_name" | "avatar_url" | "young_key" | "account_type" | "role" | "status">;
  wallet: Pick<Wallet, "id" | "balance" | "status" | "wallet_type">;
  recent_transactions: LedgerTransaction[];
};

export type TransferPayload = {
  to_young_key: string;
  amount: number;
  description?: string;
  idempotency_key: string;
};

export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "INVALID_INPUT"
  | "NOT_FOUND"
  | "WALLET_BLOCKED"
  | "INSUFFICIENT_FUNDS"
  | "LIMIT_EXCEEDED"
  | "RATE_LIMITED"
  | "IDEMPOTENT_REPLAY"
  | "SERVER_ERROR";

export type ApiError = {
  code: ApiErrorCode;
  message: string;
};

export const currency = {
  code: "YC",
  format(value: number | string): string {
    const amount = typeof value === "string" ? Number(value) : value;
    return `${amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} YC`;
  }
};

export function createIdempotencyKey(prefix = "yc"): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`;
}
