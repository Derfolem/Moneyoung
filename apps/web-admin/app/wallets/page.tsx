"use client";

import { useEffect, useState } from "react";
import { currency, type WalletStatus } from "@moneyoung/shared";
import { AdminShell } from "../../src/components/AdminShell";
import { DataTable, StatusPill, StateMessage, type Column } from "../../src/components/DataTable";
import { changeWalletStatus, listWallets, type EnrichedWallet } from "../../src/services/admin";

const accountTypeLabel: Record<string, string> = {
  personal: "Aluno",
  business: "Empresa",
  sub_business: "Professor",
  system: "Admin",
};

export default function WalletsPage() {
  const [rows, setRows] = useState<EnrichedWallet[]>([]);
  const [status, setStatus] = useState<WalletStatus | "">("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [actionTarget, setActionTarget] = useState<EnrichedWallet | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setRows(await listWallets({ status, query }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar wallets.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [status]);

  async function submitStatus(walletId: string, nextStatus: WalletStatus, reason: string) {
    setNotice("");
    try {
      await changeWalletStatus(walletId, nextStatus, reason);
      setNotice("Status da wallet atualizado.");
      setActionTarget(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao alterar status.");
    }
  }

  const columns: Column<EnrichedWallet>[] = [
    {
      key: "owner_name",
      header: "Titular",
      render: (row) => (
        <div>
          <strong>{row.owner_name ?? "—"}</strong>
          <br />
          <small style={{ color: "#666" }}>{row.owner_young_key ?? ""}</small>
        </div>
      ),
    },
    {
      key: "owner_account_type",
      header: "Tipo",
      render: (row) => row.owner_account_type ? (
        <span className={`pill pill-${row.owner_account_type}`}>
          {accountTypeLabel[row.owner_account_type] ?? row.owner_account_type}
        </span>
      ) : <span>—</span>,
    },
    {
      key: "organization_name",
      header: "Organização",
      render: (row) => <span>{row.organization_name ?? "—"}</span>,
    },
    {
      key: "balance",
      header: "Saldo",
      render: (row) => currency.format(row.balance),
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusPill value={row.status} />,
    },
    {
      key: "updated_at",
      header: "Atualizada em",
      render: (row) => new Date(row.updated_at).toLocaleString("pt-BR"),
    },
    {
      key: "id",
      header: "Ação",
      render: (row) => (
        <button
          className="secondary"
          style={{ fontSize: "0.8rem", padding: "4px 10px" }}
          onClick={() => setActionTarget(row)}
        >
          {row.status === "active" ? "Bloquear" : "Desbloquear"}
        </button>
      ),
    },
  ];

  return (
    <AdminShell>
      <div className="pageHeader"><h1>Wallets</h1></div>
      <div className="filters">
        <input
          placeholder="Buscar por nome ou chave Moneyoung"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          onBlur={load}
        />
        <button className="secondary" onClick={load}>Buscar</button>
        <select value={status} onChange={(e) => setStatus(e.target.value as WalletStatus | "")}>
          <option value="">Todos</option>
          <option value="active">Active</option>
          <option value="blocked">Blocked</option>
          <option value="frozen">Frozen</option>
        </select>
      </div>
      {notice && <p className="success" style={{ margin: "8px 0" }}>{notice}</p>}
      <DataTable rows={rows} columns={columns} loading={loading} error={error} />
      {actionTarget && (
        <WalletActionModal
          wallet={actionTarget}
          onClose={() => setActionTarget(null)}
          onSubmit={submitStatus}
        />
      )}
    </AdminShell>
  );
}

function WalletActionModal({
  wallet,
  onClose,
  onSubmit,
}: {
  wallet: EnrichedWallet;
  onClose: () => void;
  onSubmit: (walletId: string, status: WalletStatus, reason: string) => Promise<void>;
}) {
  const nextStatus: WalletStatus = wallet.status === "active" ? "blocked" : "active";
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setBusy(true);
    setError("");
    try {
      await onSubmit(wallet.id, nextStatus, reason.trim() || `${nextStatus === "blocked" ? "Bloqueio" : "Desbloqueio"} pelo painel admin`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao alterar status.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
      display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
    }}>
      <div className="panel" style={{ minWidth: 360, maxWidth: 480 }}>
        <h2>{nextStatus === "blocked" ? "Bloquear" : "Desbloquear"} Wallet</h2>
        <p><strong>Titular:</strong> {wallet.owner_name ?? "—"}</p>
        <p><strong>Chave:</strong> {wallet.owner_young_key ?? "—"}</p>
        <p><strong>Saldo:</strong> {currency.format(wallet.balance)}</p>
        <p><strong>Status atual:</strong> <StatusPill value={wallet.status} /></p>
        <p><strong>Novo status:</strong> <StatusPill value={nextStatus} /></p>
        <div style={{ marginTop: 12 }}>
          <input
            placeholder="Motivo (opcional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            style={{ width: "100%", marginBottom: 8 }}
          />
        </div>
        {error && <StateMessage tone="danger" title="Erro" detail={error} />}
        <div style={{ display: "flex", gap: 8, marginTop: 12, justifyContent: "flex-end" }}>
          <button className="secondary" onClick={onClose} disabled={busy}>Cancelar</button>
          <button onClick={submit} disabled={busy} style={{
            background: nextStatus === "blocked" ? "#c62828" : "#2e7d32",
            color: "#fff",
          }}>
            {busy ? "Aplicando..." : nextStatus === "blocked" ? "Confirmar Bloqueio" : "Confirmar Desbloqueio"}
          </button>
        </div>
      </div>
    </div>
  );
}
