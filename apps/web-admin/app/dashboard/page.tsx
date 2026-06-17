"use client";

import { useEffect, useState } from "react";
import { currency, type LedgerTransaction } from "@youngcoin/shared";
import { AdminShell } from "../../src/components/AdminShell";
import { DataTable, StatusPill, StateMessage, type Column } from "../../src/components/DataTable";
import { getDashboardSummary, type DashboardSummary } from "../../src/services/admin";

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDashboardSummary()
      .then(setSummary)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const byDay = Object.entries(summary?.transactions_by_day ?? {}).slice(-10);
  const max = Math.max(1, ...byDay.map(([, value]) => value));

  return (
    <AdminShell>
      <div className="pageHeader"><h1>Dashboard</h1></div>
      {error ? <StateMessage tone="danger" title="Resumo indisponivel" detail={error} /> : null}
      <div className="grid">
        <Metric label="Contas" value={summary?.total_accounts} loading={loading} />
        <Metric label="Wallets" value={summary?.total_wallets} loading={loading} />
        <Metric label="Transacoes" value={summary?.total_transactions} loading={loading} />
        <Metric label="Volume" value={summary ? currency.format(summary.total_volume) : undefined} loading={loading} />
        <Metric label="Wallets restritas" value={summary?.blocked_wallets} loading={loading} />
        <Metric label="Eventos criticos" value={summary?.suspicious_transactions} loading={loading} />
      </div>
      <section className="panel" style={{ marginTop: 16 }}>
        <h2>Transacoes por dia</h2>
        {loading ? <StateMessage title="Carregando serie..." /> : byDay.length ? (
          <div className="chart">
            {byDay.map(([day, value]) => (
              <div key={day} className="barGroup">
                <div title={`${day}: ${value}`} className="bar" style={{ height: `${(value / max) * 160}px` }} />
                <span>{day.slice(5)}</span>
              </div>
            ))}
          </div>
        ) : <StateMessage title="Sem transacoes no periodo." />}
      </section>
      <section style={{ marginTop: 16 }}>
        <h2>Ultimas transacoes</h2>
        <DataTable rows={summary?.latest_transactions ?? []} columns={transactionColumns} loading={loading} />
      </section>
    </AdminShell>
  );
}

const transactionColumns: Column<LedgerTransaction>[] = [
  { key: "id", header: "id" },
  { key: "type", header: "tipo" },
  { key: "status", header: "status", render: (row) => <StatusPill value={row.status} /> },
  { key: "amount", header: "valor", render: (row) => currency.format(row.amount) },
  { key: "created_at", header: "data", render: (row) => new Date(row.created_at).toLocaleString("pt-BR") }
];

function Metric({ label, value, loading }: { label: string; value?: number | string | undefined; loading: boolean }) {
  return <div className="card"><span className="muted">{label}</span><strong>{loading ? "..." : value ?? 0}</strong></div>;
}
