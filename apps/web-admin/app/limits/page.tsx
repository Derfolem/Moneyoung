"use client";

import { useEffect, useState } from "react";
import { currency } from "@youngcoin/shared";
import { AdminShell } from "../../src/components/AdminShell";
import { DataTable, StateMessage, type Column } from "../../src/components/DataTable";
import { listTransferLimits, updateTransferLimit, type TransferLimit } from "../../src/services/admin";

export default function LimitsPage() {
  const [rows, setRows] = useState<TransferLimit[]>([]);
  const [selected, setSelected] = useState<TransferLimit | null>(null);
  const [daily, setDaily] = useState("");
  const [transaction, setTransaction] = useState("");
  const [minute, setMinute] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setRows(await listTransferLimits());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar limites.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  function edit(row: TransferLimit) {
    setSelected(row);
    setDaily(String(row.daily_limit));
    setTransaction(String(row.transaction_limit));
    setMinute(String(row.minute_limit));
    setNotice("");
    setError("");
  }

  async function save() {
    if (!selected) return;
    if (Number(daily) <= 0 || Number(transaction) <= 0 || Number(minute) <= 0) {
      setError("Informe limites maiores que zero.");
      return;
    }
    setSaving(true);
    setError("");
    setNotice("");
    try {
      await updateTransferLimit(selected.id, { daily_limit: daily, transaction_limit: transaction, minute_limit: Number(minute) });
      setNotice("Limite atualizado.");
      setSelected(null);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar limite.");
    } finally {
      setSaving(false);
    }
  }

  const columns: Column<TransferLimit>[] = [
    { key: "account_type", header: "tipo de conta" },
    { key: "daily_limit", header: "limite diario", render: (row) => currency.format(row.daily_limit) },
    { key: "transaction_limit", header: "por transacao", render: (row) => currency.format(row.transaction_limit) },
    { key: "minute_limit", header: "por minuto" },
    { key: "updated_at", header: "atualizado em", render: (row) => new Date(row.updated_at).toLocaleString("pt-BR") },
    { key: "actions", header: "", render: (row) => <button className="secondary" onClick={() => edit(row)}>Editar</button> }
  ];

  return (
    <AdminShell>
      <div className="pageHeader"><h1>Limites</h1></div>
      <p className="muted">Ajustes exigem admin autenticado. O frontend nunca altera saldo.</p>
      {notice ? <p className="success">{notice}</p> : null}
      <DataTable rows={rows} columns={columns} loading={loading} error={error && !selected ? error : undefined} />
      {selected ? (
        <section className="panel" style={{ marginTop: 16 }}>
          <h2>Editar {selected.account_type}</h2>
          <div className="form">
            <input type="number" min="0" step="0.01" placeholder="limite diario" value={daily} onChange={(e) => setDaily(e.target.value)} />
            <input type="number" min="0" step="0.01" placeholder="por transacao" value={transaction} onChange={(e) => setTransaction(e.target.value)} />
            <input type="number" min="1" step="1" placeholder="por minuto" value={minute} onChange={(e) => setMinute(e.target.value)} />
            <button onClick={save} disabled={saving}>{saving ? "Salvando..." : "Salvar"}</button>
            <button className="secondary" onClick={() => setSelected(null)} disabled={saving}>Cancelar</button>
          </div>
          {error ? <StateMessage tone="danger" title="Nao foi possivel salvar" detail={error} /> : null}
        </section>
      ) : null}
    </AdminShell>
  );
}
