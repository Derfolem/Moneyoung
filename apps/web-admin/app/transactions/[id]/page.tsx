"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { createIdempotencyKey, currency, type LedgerTransaction } from "@moneyoung/shared";
import { AdminShell } from "../../../src/components/AdminShell";
import { DataTable, StateMessage, StatusPill, type Column } from "../../../src/components/DataTable";
import { getTransaction, listTransactionAuditLogs, reverseTransaction, type AuditLog } from "../../../src/services/admin";

export default function TransactionDetailPage({ params }: { params: { id: string } }) {
  const [tx, setTx] = useState<LedgerTransaction | null>(null);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("Estorno via painel Moneyoungbank");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    Promise.all([getTransaction(params.id), listTransactionAuditLogs(params.id)])
      .then(([transaction, auditLogs]) => {
        setTx(transaction);
        setLogs(auditLogs);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [params.id]);

  async function reverse() {
    if (!tx || tx.status !== "completed") return;
    const confirmed = window.confirm("Confirmar estorno desta transacao? A operacao altera wallets via funcao segura e gera auditoria.");
    if (!confirmed) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await reverseTransaction(params.id, reason.trim() || "Estorno administrativo", createIdempotencyKey("web_reversal"));
      const [transaction, auditLogs] = await Promise.all([getTransaction(params.id), listTransactionAuditLogs(params.id)]);
      setTx(transaction);
      setLogs(auditLogs);
      setNotice("Transacao estornada.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao estornar transacao.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AdminShell>
      <div className="pageHeader"><h1>Detalhe da transacao</h1>{tx?.status === "completed" ? <button className="danger" onClick={reverse} disabled={busy}>{busy ? "Estornando..." : "Estornar"}</button> : null}</div>
      {loading ? <StateMessage title="Carregando transacao..." /> : null}
      {error ? <StateMessage tone="danger" title="Operacao indisponivel" detail={error} /> : null}
      {notice ? <p className="success">{notice}</p> : null}
      {!loading && !error && !tx ? <StateMessage title="Transacao nao encontrada." /> : null}
      {tx ? (
        <section className="panel detailGrid">
          <Field label="ID" value={tx.id} />
          <Field label="Status" value={<StatusPill value={tx.status} />} />
          <Field label="Tipo" value={tx.type} />
          <Field label="Valor" value={currency.format(tx.amount)} />
          <Field label="Origem" value={<>{tx.from_display_name ?? tx.from_wallet_id ?? "-"}{tx.from_young_key ? <span className="muted" style={{ marginLeft: 4 }}>{tx.from_young_key}</span> : null}{tx.from_account_type ? <span className={`pill pill-${tx.from_account_type}`} style={{ marginLeft: 4 }}>{accountTypeLabel[tx.from_account_type] ?? tx.from_account_type}</span> : null}</>} />
          <Field label="Destino" value={<>{tx.to_display_name ?? tx.to_wallet_id ?? "-"}{tx.to_young_key ? <span className="muted" style={{ marginLeft: 4 }}>{tx.to_young_key}</span> : null}{tx.to_account_type ? <span className={`pill pill-${tx.to_account_type}`} style={{ marginLeft: 4 }}>{accountTypeLabel[tx.to_account_type] ?? tx.to_account_type}</span> : null}</>} />
          <Field label="Criada em" value={new Date(tx.created_at).toLocaleString("pt-BR")} />
          <Field label="Reversao de" value={tx.reversed_transaction_id ?? "-"} />
          <Field label="Descricao" value={tx.description ?? "-"} wide />
          <Field label="Metadata" value={<code>{JSON.stringify(tx.metadata ?? {})}</code>} wide />
        </section>
      ) : null}
      {tx?.status === "completed" ? (
        <section className="panel" style={{ marginTop: 16 }}>
          <h2>Motivo do estorno</h2>
          <div className="form"><input value={reason} onChange={(event) => setReason(event.target.value)} /></div>
        </section>
      ) : null}
      <h2>Audit logs relacionados</h2>
      <DataTable rows={logs} columns={auditColumns} loading={loading} />
    </AdminShell>
  );
}

function Field({ label, value, wide = false }: { label: string; value: ReactNode; wide?: boolean }) {
  return <div className={wide ? "detailWide" : ""}><span className="muted">{label}</span><strong>{value}</strong></div>;
}

const accountTypeLabel: Record<string, string> = { personal: "Aluno", business: "Empresa", sub_business: "Professor", system: "Admin" };

const auditColumns: Column<AuditLog>[] = [
  { key: "created_at", header: "data", render: (row) => new Date(row.created_at).toLocaleString("pt-BR") },
  { key: "action", header: "acao" },
  { key: "actor_profile_id", header: "admin" },
  { key: "metadata", header: "metadata", render: (row) => JSON.stringify(row.metadata ?? {}) }
];
