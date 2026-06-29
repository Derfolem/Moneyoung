"use client";

import { useEffect, useState } from "react";
import type { Profile, ProfileRole, ProfileStatus } from "@moneyoung/shared";
import { AdminShell } from "../../src/components/AdminShell";
import { DataTable, StateMessage, StatusPill, type Column } from "../../src/components/DataTable";
import { listAccounts, purgeProfile } from "../../src/services/admin";

export default function AccountsPage() {
  const [rows, setRows] = useState<Profile[]>([]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<ProfileRole | "">("");
  const [status, setStatus] = useState<ProfileStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");

  const [confirmPurge, setConfirmPurge] = useState<Profile | null>(null);
  const [confirmPurgeText, setConfirmPurgeText] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    listAccounts({ query, role, status })
      .then(setRows)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, [query, role, status]);

  async function handlePurge(profile: Profile) {
    if (confirmPurgeText !== profile.email) {
      setError("E-mail não confere. Operação cancelada.");
      return;
    }
    setBusy("purge"); setError(""); setNotice("");
    try {
      await purgeProfile(profile.id);
      setConfirmPurge(null);
      setConfirmPurgeText("");
      setNotice(`Dados de "${profile.display_name ?? profile.email}" apagados permanentemente.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao limpar dados.");
    } finally {
      setBusy("");
    }
  }

  const columns: Column<Profile>[] = [
    { key: "email", header: "e-mail" },
    { key: "display_name", header: "nome" },
    { key: "young_key", header: "young key" },
    {
      key: "account_type", header: "conta",
      render: (row) => <span className={`pill pill-${row.account_type}`}>{accountTypeLabel[row.account_type] ?? row.account_type}</span>,
    },
    { key: "role", header: "role" },
    { key: "status", header: "status", render: (row) => <StatusPill value={row.status} /> },
    { key: "created_at", header: "criada em", render: (row) => new Date(row.created_at).toLocaleString("pt-BR") },
    {
      key: "id", header: "Ações",
      render: (row) => {
        if (row.status === "deleted") {
          return (
            <button
              className="danger sm"
              style={{ fontSize: "0.8rem", padding: "4px 10px" }}
              onClick={() => { setConfirmPurge(row); setConfirmPurgeText(""); }}>
              Limpar Dados
            </button>
          );
        }
        return <span className="muted" style={{ fontSize: "0.8rem" }}>—</span>;
      },
    },
  ];

  return (
    <AdminShell>
      <div className="pageHeader"><h1>Contas</h1></div>
      {notice && <p className="success" style={{ margin: "8px 0" }}>{notice}</p>}
      {error && <StateMessage tone="danger" title="Erro" detail={error} />}

      <div className="filters">
        <input placeholder="e-mail ou young_key" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select value={role} onChange={(e) => setRole(e.target.value as ProfileRole | "")}>
          <option value="">Todos roles</option>
          <option>common_user</option>
          <option>organization_admin</option>
          <option>bank_admin</option>
          <option>super_admin</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value as ProfileStatus | "")}>
          <option value="">Todos status</option>
          <option>active</option>
          <option>blocked</option>
          <option>pending</option>
          <option>deleted</option>
        </select>
      </div>

      <DataTable rows={rows} columns={columns} loading={loading} error={error} />

      {/* Modal: Limpar Dados do perfil */}
      {confirmPurge && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
          <div className="panel" style={{ minWidth: 380, maxWidth: 520, border: "2px solid var(--danger)" }}>
            <h2 style={{ color: "var(--danger)" }}>⚠ Limpar Dados — {confirmPurge.display_name ?? confirmPurge.email}</h2>
            <p style={{ color: "#FCA5A5" }}>
              Esta ação <strong>apaga permanentemente</strong> o perfil, carteira e todos os dados relacionados.
              <strong> Não pode ser desfeita.</strong>
            </p>
            <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", marginBottom: 12 }}>
              Digite o e-mail da conta para confirmar:
            </p>
            <input
              placeholder={confirmPurge.email}
              value={confirmPurgeText}
              onChange={(e) => setConfirmPurgeText(e.target.value)}
              style={{ width: "100%", marginBottom: 16 }}
            />
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="secondary" onClick={() => { setConfirmPurge(null); setConfirmPurgeText(""); }} disabled={busy === "purge"}>
                Cancelar
              </button>
              <button
                className="danger"
                onClick={() => handlePurge(confirmPurge)}
                disabled={busy === "purge" || confirmPurgeText !== confirmPurge.email}>
                {busy === "purge" ? "Limpando..." : "Apagar Tudo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}

const accountTypeLabel: Record<string, string> = {
  personal: "Aluno",
  business: "Empresa",
  sub_business: "Professor",
  system: "Admin",
};
