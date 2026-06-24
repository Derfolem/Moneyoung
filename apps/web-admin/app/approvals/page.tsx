"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "../../src/components/AdminShell";
import { DataTable, StateMessage, type Column } from "../../src/components/DataTable";
import {
  approveRegistration,
  listPendingRegistrations,
  listCancellationRequests,
  processCancellation,
  reactivateAccount,
  type PendingRegistration,
  type CancellationRequest,
} from "../../src/services/admin";

const typeLabel: Record<string, string> = {
  personal: "Aluno",
  sub_business: "Colaborador",
};

function calcAge(birthDate: string | null): string {
  if (!birthDate) return "—";
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return `${age} anos`;
}

export default function ApprovalsPage() {
  const [rows, setRows] = useState<PendingRegistration[]>([]);
  const [cancellations, setCancellations] = useState<CancellationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");
  const [rejectTarget, setRejectTarget] = useState<PendingRegistration | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [tab, setTab] = useState<"registrations" | "cancellations">("registrations");

  async function load() {
    setLoading(true);
    setError("");
    try {
      const [regs, cancs] = await Promise.all([
        listPendingRegistrations(),
        listCancellationRequests(),
      ]);
      setRows(regs);
      setCancellations(cancs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar dados.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleApprove(reg: PendingRegistration) {
    setBusy(reg.id);
    setError("");
    setNotice("");
    try {
      await approveRegistration(reg.id, true);
      setNotice(`Cadastro de "${reg.display_name}" aprovado!`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao aprovar cadastro.");
    } finally {
      setBusy("");
    }
  }

  async function handleReject() {
    if (!rejectTarget) return;
    setBusy(rejectTarget.id);
    setError("");
    setNotice("");
    try {
      await approveRegistration(rejectTarget.id, false, rejectReason.trim() || undefined);
      setNotice(`Cadastro de "${rejectTarget.display_name}" recusado.`);
      setRejectTarget(null);
      setRejectReason("");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao recusar cadastro.");
    } finally {
      setBusy("");
    }
  }

  async function handleCancellation(profileId: string, name: string, approved: boolean) {
    setBusy(profileId);
    setError("");
    setNotice("");
    try {
      await processCancellation(profileId, approved);
      setNotice(approved
        ? `Conta de "${name}" cancelada com sucesso. Historico de transacoes preservado.`
        : `Cancelamento de "${name}" recusado. Conta mantida ativa.`
      );
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao processar cancelamento.");
    } finally {
      setBusy("");
    }
  }

  async function handleReactivate(profileId: string, name: string) {
    setBusy(profileId);
    setError("");
    setNotice("");
    try {
      await reactivateAccount(profileId);
      setNotice(`Conta de "${name}" reativada com sucesso.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao reativar conta.");
    } finally {
      setBusy("");
    }
  }

  const regColumns: Column<PendingRegistration>[] = [
    {
      key: "display_name", header: "Nome",
      render: (row) => (
        <div>
          <strong>{row.full_name ?? row.display_name}</strong>
          <br /><small className="muted">{row.email}</small>
        </div>
      ),
    },
    {
      key: "young_key", header: "Chave",
      render: (row) => <code style={{ fontSize: "0.85rem" }}>{row.young_key}</code>,
    },
    {
      key: "account_type", header: "Tipo",
      render: (row) => (
        <span className={`pill pill-${row.account_type}`}>
          {typeLabel[row.account_type] ?? row.account_type}
        </span>
      ),
    },
    {
      key: "birth_date", header: "Idade",
      render: (row) => calcAge(row.birth_date),
    },
    {
      key: "invited_by_org_id", header: "Escola",
      render: (row) => row.organization_name ?? "—",
    },
    {
      key: "created_at", header: "Data",
      render: (row) => new Date(row.created_at).toLocaleString("pt-BR"),
    },
    {
      key: "id", header: "Acoes",
      render: (row) => (
        <div style={{ display: "flex", gap: 6 }}>
          <button
            style={{ fontSize: "0.8rem", padding: "4px 12px" }}
            onClick={() => handleApprove(row)}
            disabled={busy === row.id}
          >
            {busy === row.id ? "..." : "Aprovar"}
          </button>
          <button
            className="danger"
            style={{ fontSize: "0.8rem", padding: "4px 12px" }}
            onClick={() => { setRejectTarget(row); setRejectReason(""); }}
            disabled={busy === row.id}
          >
            Recusar
          </button>
        </div>
      ),
    },
  ];

  const cancColumns: Column<CancellationRequest>[] = [
    {
      key: "display_name", header: "Nome",
      render: (row) => (
        <div>
          <strong>{row.full_name ?? row.display_name}</strong>
          <br /><small className="muted">{row.email}</small>
        </div>
      ),
    },
    {
      key: "young_key", header: "Chave",
      render: (row) => <code style={{ fontSize: "0.85rem" }}>{row.young_key}</code>,
    },
    {
      key: "account_type", header: "Tipo",
      render: (row) => (
        <span className={`pill pill-${row.account_type}`}>
          {typeLabel[row.account_type] ?? row.account_type}
        </span>
      ),
    },
    {
      key: "invited_by_org_id", header: "Escola",
      render: (row) => row.organization_name ?? "—",
    },
    {
      key: "status", header: "Status",
      render: (row) => row.status,
    },
    {
      key: "cancellation_requested_at", header: "Solicitado em",
      render: (row) => new Date(row.cancellation_requested_at).toLocaleString("pt-BR"),
    },
    {
      key: "id", header: "Acoes",
      render: (row) => (
        <div style={{ display: "flex", gap: 6 }}>
          <button
            className="danger"
            style={{ fontSize: "0.8rem", padding: "4px 12px" }}
            onClick={() => handleCancellation(row.id, row.display_name, true)}
            disabled={busy === row.id}
          >
            {busy === row.id ? "..." : "Confirmar Cancelamento"}
          </button>
          <button
            style={{ fontSize: "0.8rem", padding: "4px 12px" }}
            onClick={() => handleCancellation(row.id, row.display_name, false)}
            disabled={busy === row.id}
          >
            Recusar
          </button>
          {row.status === "deleted" || row.status === "blocked" ? (
            <button
              style={{ fontSize: "0.8rem", padding: "4px 12px", background: "#22c55e", color: "#fff" }}
              onClick={() => handleReactivate(row.id, row.display_name)}
              disabled={busy === row.id}
            >
              Reativar
            </button>
          ) : null}
        </div>
      ),
    },
  ];

  const regCount = rows.length;
  const cancCount = cancellations.length;

  return (
    <AdminShell>
      <div className="pageHeader"><h1>Aprovacoes</h1></div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button
          className={tab === "registrations" ? "" : "secondary"}
          onClick={() => setTab("registrations")}
          style={{ fontSize: "0.85rem", padding: "6px 16px" }}
        >
          Cadastros Pendentes {regCount > 0 && `(${regCount})`}
        </button>
        <button
          className={tab === "cancellations" ? "" : "secondary"}
          onClick={() => setTab("cancellations")}
          style={{ fontSize: "0.85rem", padding: "6px 16px" }}
        >
          Cancelamentos {cancCount > 0 && `(${cancCount})`}
        </button>
      </div>

      {notice && <p className="success" style={{ margin: "8px 0" }}>{notice}</p>}
      {error && <StateMessage tone="danger" title="Erro" detail={error} />}

      {tab === "registrations" && (
        <>
          <p className="hint" style={{ marginBottom: 16 }}>
            Usuarios que se cadastraram via codigo convite e aguardam aprovacao do banco.
          </p>
          <DataTable rows={rows} columns={regColumns} loading={loading} error={loading ? undefined : error} />
          {!loading && rows.length === 0 && (
            <p className="muted" style={{ textAlign: "center", padding: 24 }}>
              Nenhum cadastro pendente no momento.
            </p>
          )}
        </>
      )}

      {tab === "cancellations" && (
        <>
          <p className="hint" style={{ marginBottom: 16 }}>
            Usuarios que solicitaram cancelamento de conta. Ao confirmar, a conta sera desativada mas o historico de transacoes sera preservado.
          </p>
          <DataTable rows={cancellations} columns={cancColumns} loading={loading} error={loading ? undefined : error} />
          {!loading && cancellations.length === 0 && (
            <p className="muted" style={{ textAlign: "center", padding: 24 }}>
              Nenhuma solicitacao de cancelamento no momento.
            </p>
          )}
        </>
      )}

      {rejectTarget && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div className="panel" style={{ minWidth: 360, maxWidth: 480 }}>
            <h2>Recusar Cadastro</h2>
            <p>Recusar o cadastro de <strong>{rejectTarget.full_name ?? rejectTarget.display_name}</strong>?</p>
            <div style={{ margin: "12px 0" }}>
              <label>Motivo (opcional)</label>
              <input
                placeholder="Ex: Dados incompletos"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
              <button className="secondary" onClick={() => setRejectTarget(null)}>Cancelar</button>
              <button className="danger" onClick={handleReject} disabled={!!busy}>
                {busy ? "Recusando..." : "Confirmar Recusa"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
