"use client";

import { useEffect, useState } from "react";
import { currency, type Wallet, type WalletStatus } from "@youngcoin/shared";
import { AdminShell } from "../../src/components/AdminShell";
import { DataTable, StatusPill, StateMessage, type Column } from "../../src/components/DataTable";
import { changeWalletStatus, listWallets } from "../../src/services/admin";

export default function WalletsPage() {
  const [rows, setRows] = useState<Wallet[]>([]);
  const [status, setStatus] = useState<WalletStatus | "">("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

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
    await changeWalletStatus(walletId, nextStatus, reason);
    setNotice("Status da wallet atualizado.");
    await load();
  }
  return (
    <AdminShell>
      <div className="pageHeader"><h1>Wallets</h1></div>
      <div className="filters">
        <input placeholder="wallet, profile ou organizacao" value={query} onChange={(e) => setQuery(e.target.value)} onBlur={load} />
        <button className="secondary" onClick={load}>Buscar</button>
        <select value={status} onChange={(e) => setStatus(e.target.value as WalletStatus | "")}><option value="">Todos</option><option>active</option><option>blocked</option><option>frozen</option></select>
      </div>
      <DataTable rows={rows} columns={columns} loading={loading} error={error} />
      <section className="panel" style={{ marginTop: 16 }}>
        <h2>Bloquear ou desbloquear</h2>
        {notice ? <p className="success">{notice}</p> : null}
        <WalletAction onSubmit={submitStatus} />
      </section>
    </AdminShell>
  );
}

const columns: Column<Wallet>[] = [
  { key: "id", header: "wallet" },
  { key: "profile_id", header: "profile" },
  { key: "organization_id", header: "org" },
  { key: "wallet_type", header: "tipo" },
  { key: "balance", header: "saldo", render: (row) => currency.format(row.balance) },
  { key: "status", header: "status", render: (row) => <StatusPill value={row.status} /> },
  { key: "updated_at", header: "atualizada em", render: (row) => new Date(row.updated_at).toLocaleString("pt-BR") }
];

function WalletAction({ onSubmit }: { onSubmit: (walletId: string, status: WalletStatus, reason: string) => Promise<void> }) {
  const [walletId, setWalletId] = useState("");
  const [status, setStatus] = useState<WalletStatus>("blocked");
  const [reason, setReason] = useState("Alteracao pelo painel admin");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    if (!walletId.trim()) {
      setError("Informe o wallet_id.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSubmit(walletId.trim(), status, reason.trim() || "Alteracao pelo painel admin");
      setWalletId("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao alterar status.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <div className="form">
        <input placeholder="wallet_id" value={walletId} onChange={(e) => setWalletId(e.target.value)} />
        <select value={status} onChange={(e) => setStatus(e.target.value as WalletStatus)}><option>blocked</option><option>active</option><option>frozen</option></select>
        <input placeholder="motivo" value={reason} onChange={(e) => setReason(e.target.value)} />
        <button onClick={submit} disabled={busy}>{busy ? "Aplicando..." : "Aplicar"}</button>
      </div>
      {error ? <StateMessage tone="danger" title="Acao nao concluida" detail={error} /> : null}
    </>
  );
}
