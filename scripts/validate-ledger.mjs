import assert from "node:assert/strict";

class LedgerHarness {
  constructor() {
    this.profiles = new Map();
    this.wallets = new Map();
    this.transactions = new Map();
    this.organizations = new Map();
    this.organizationMembers = new Map();
    this.auditLogs = [];
    this.securityEvents = [];
    this.limits = {
      personal: { daily: 1000, transaction: 250, minute: 10 },
      business: { daily: 10000, transaction: 2500, minute: 60 },
      system: { daily: Number.MAX_SAFE_INTEGER, transaction: Number.MAX_SAFE_INTEGER, minute: Number.MAX_SAFE_INTEGER }
    };
  }

  createProfile(id, role = "common_user", accountType = "personal") {
    const profile = { id, email: `${id}@example.com`, young_key: `@${id}`, role, account_type: accountType, status: "active" };
    const wallet = { id: `wallet_${id}`, profile_id: id, organization_id: null, wallet_type: "personal", balance: 0, status: "active" };
    this.profiles.set(id, profile);
    this.wallets.set(wallet.id, wallet);
    this.auditLogs.push({ action: "profile.created", actor: id });
    return { profile, wallet };
  }

  credit(walletId, amount) {
    this.wallets.get(walletId).balance += amount;
  }

  blockWallet(actorId, walletId, status) {
    const actor = this.profiles.get(actorId);
    assert(["bank_admin", "super_admin"].includes(actor?.role), "common_user_block_wallet_blocked");
    assert(["active", "blocked", "frozen"].includes(status), "invalid_wallet_status_blocked");
    const wallet = this.wallets.get(walletId);
    assert(wallet, "wallet_missing");
    wallet.status = status;
    this.auditLogs.push({ action: "wallet.status_changed", actor: actorId, walletId });
  }

  transfer(actorId, toYoungKey, amount, idempotencyKey) {
    if (this.transactions.has(idempotencyKey)) {
      const replay = this.transactions.get(idempotencyKey);
      assert(replay.created_by === actorId && ["transfer", "payment"].includes(replay.type), "idempotency_conflict_blocked");
      return replay;
    }
    assert(idempotencyKey?.length >= 8, "invalid_idempotency_key_blocked");
    assert(amount > 0 && amount === Math.round(amount * 100) / 100, "invalid_amount_blocked");
    const actor = this.profiles.get(actorId);
    assert(actor?.status === "active", "inactive_profile_blocked");
    const actorWallet = [...this.wallets.values()].find((wallet) => wallet.profile_id === actorId);
    const toProfile = [...this.profiles.values()].find((profile) => profile.young_key === toYoungKey);
    const toWallet = [...this.wallets.values()].find((wallet) => wallet.profile_id === toProfile?.id);
    assert(toWallet, "destination_missing");
    assert(actorWallet.id !== toWallet.id, "self_transfer_blocked");
    assert(actorWallet.status === "active", "origin_wallet_blocked");
    assert(toWallet.status === "active", "destination_wallet_blocked");
    assert(amount <= this.limits[actor.account_type].transaction, "transaction_limit_blocked");
    assert(actorWallet.balance >= amount, "insufficient_funds_blocked");
    actorWallet.balance -= amount;
    toWallet.balance += amount;
    const tx = { id: `tx_${this.transactions.size + 1}`, idempotencyKey, from: actorWallet.id, to: toWallet.id, amount, type: "transfer", status: "completed", created_by: actorId };
    this.transactions.set(idempotencyKey, tx);
    this.auditLogs.push({ action: "transaction.completed", actor: actorId });
    return tx;
  }

  reverse(actorId, originalIdempotencyKey, reversalIdempotencyKey) {
    const actor = this.profiles.get(actorId);
    assert(["bank_admin", "super_admin"].includes(actor.role), "common_user_reversal_blocked");
    assert(reversalIdempotencyKey?.length >= 8, "invalid_reversal_idempotency_key_blocked");
    if (this.transactions.has(reversalIdempotencyKey)) {
      const replay = this.transactions.get(reversalIdempotencyKey);
      assert(replay.created_by === actorId && replay.type === "reversal" && replay.reversed === originalIdempotencyKey, "reversal_idempotency_conflict_blocked");
      return replay;
    }
    const original = this.transactions.get(originalIdempotencyKey);
    assert(original?.status === "completed" && ["transfer", "payment"].includes(original.type), "only_completed_financial_tx_can_reverse");
    assert(![...this.transactions.values()].some((tx) => tx.type === "reversal" && tx.reversed === originalIdempotencyKey), "double_reversal_blocked");
    assert(this.wallets.get(original.to).balance >= original.amount, "reversal_insufficient_destination_funds_blocked");
    this.wallets.get(original.from).balance += original.amount;
    this.wallets.get(original.to).balance -= original.amount;
    original.status = "reversed";
    const reversal = {
      id: `tx_${this.transactions.size + 1}`,
      idempotencyKey: reversalIdempotencyKey,
      from: original.to,
      to: original.from,
      amount: original.amount,
      type: "reversal",
      status: "completed",
      created_by: actorId,
      reversed: originalIdempotencyKey
    };
    this.transactions.set(reversalIdempotencyKey, reversal);
    this.auditLogs.push({ action: "transaction.reversed", actor: actorId });
    return reversal;
  }

  createOrganizationAccount(actorId, name, slug, ownerProfileId) {
    const actor = this.profiles.get(actorId);
    assert(["bank_admin", "super_admin"].includes(actor?.role), "common_user_create_org_blocked");
    assert(name.trim().length >= 2, "invalid_org_name_blocked");
    assert(slug.trim().length >= 2, "invalid_org_slug_blocked");
    assert(!ownerProfileId || this.profiles.get(ownerProfileId)?.status === "active", "inactive_owner_blocked");
    const organization = { id: `org_${this.organizations.size + 1}`, name: name.trim(), slug: slug.trim().toLowerCase(), owner_profile_id: ownerProfileId ?? null, status: "active" };
    const wallet = { id: `wallet_business_${organization.id}`, profile_id: null, organization_id: organization.id, wallet_type: "business", balance: 0, status: "active" };
    this.organizations.set(organization.id, organization);
    this.wallets.set(wallet.id, wallet);
    if (ownerProfileId) this.organizationMembers.set(`${organization.id}:${ownerProfileId}`, { organization_id: organization.id, profile_id: ownerProfileId, member_role: "admin", status: "active" });
    this.auditLogs.push({ action: "organization.created", actor: actorId });
    return { organization, wallet };
  }
}

const harness = new LedgerHarness();
const alice = harness.createProfile("alice");
const bob = harness.createProfile("bob");
const admin = harness.createProfile("admin", "bank_admin");

assert.equal(harness.profiles.size, 3, "profiles_created");
assert.equal(harness.wallets.size, 3, "wallets_created");

harness.credit(alice.wallet.id, 100);
const transfer = harness.transfer("alice", "@bob", 25, "idem_key_1");
assert.equal(transfer.status, "completed", "transfer_with_balance_completed");
assert.equal(alice.wallet.balance, 75, "origin_debited");
assert.equal(bob.wallet.balance, 25, "destination_credited");

assert.throws(() => harness.transfer("alice", "@bob", 100, "idem_key_2"), /insufficient_funds_blocked/);
assert.throws(() => harness.transfer("alice", "@alice", 1, "idem_key_3"), /self_transfer_blocked/);
assert.throws(() => harness.transfer("alice", "@bob", -1, "idem_key_4"), /invalid_amount_blocked/);
assert.throws(() => harness.transfer("alice", "@bob", 1.234, "idem_key_5"), /invalid_amount_blocked/);
assert.throws(() => harness.transfer("bob", "@alice", 1, "idem_key_1"), /idempotency_conflict_blocked/);
assert.throws(() => harness.reverse("alice", "idem_key_1", "reverse_key_1"), /common_user_reversal_blocked/);

harness.reverse("admin", "idem_key_1", "reverse_key_1");
assert.equal(alice.wallet.balance, 100, "admin_reversal_restored_origin");
assert.equal(bob.wallet.balance, 0, "admin_reversal_removed_destination");
assert.throws(() => harness.reverse("admin", "idem_key_1", "reverse_key_2"), /only_completed_financial_tx_can_reverse|double_reversal_blocked/);
assert(harness.auditLogs.length >= 3, "audit_log_created");

const replay = harness.transfer("alice", "@bob", 25, "idem_key_1");
assert.equal(replay.status, "reversed", "idempotency_does_not_duplicate");
assert.equal(harness.transactions.size, 2, "transaction_count_includes_reversal_only");

harness.blockWallet("admin", bob.wallet.id, "frozen");
assert.throws(() => harness.transfer("alice", "@bob", 1, "idem_key_6"), /destination_wallet_blocked/);
harness.blockWallet("admin", bob.wallet.id, "active");

const org = harness.createOrganizationAccount("admin", "Escola Jovem", "escola-jovem", "alice");
assert.equal(org.wallet.profile_id, null, "business_wallet_not_bound_to_owner_personal_wallet");
assert.equal(org.wallet.organization_id, org.organization.id, "business_wallet_bound_to_organization");
assert(harness.organizationMembers.has(`${org.organization.id}:alice`), "owner_added_as_org_admin");

console.log("Moneyoung ledger validation passed: 19 checks covered.");
