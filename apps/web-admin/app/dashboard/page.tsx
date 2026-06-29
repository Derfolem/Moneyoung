"use client";

import { useEffect, useState } from "react";
import { currency, type LedgerTransaction } from "@moneyoung/shared";
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

      <h2 style={{ marginBottom: 8, fontSize: 14, color: "var(--muted)" }}>Financeiro</h2>
      <div className="grid">
        <Metric label="Valor Corrente" value={summary ? currency.format(summary.current_value) : undefined} loading={loading} highlight />
        <Metric label="Total Wallets" value={summary?.total_wallets} loading={loading} />
        <Metric label="Wallets Restritas" value={summary?.blocked_wallets} loading={loading} tone="danger" />
        <Metric label="Estornos" value={summary?.total_reversals} loading={loading} />
      </div>

      <h2 style={{ marginTop: 20, marginBottom: 8, fontSize: 14, color: "var(--muted)" }}>Contas Ativas</h2>
      <div className="grid">
        <Metric label="Total de Usuarios" value={summary?.active_users} loading={loading} />
        <Metric label="Escolas" value={summary?.active_schools} loading={loading} />
        <Metric label="Erros Hoje" value={summary?.app_errors_today} loading={loading} tone="danger" />
      </div>

      <h2 style={{ marginTop: 20, marginBottom: 8, fontSize: 14, color: "var(--muted)" }}>Transacoes</h2>
      <div className="grid">
        <Metric label="Hoje" value={summary?.transactions_today} loading={loading} />
        <Metric label="Este Mes" value={summary?.transactions_month} loading={loading} />
        <Metric label="Este Ano" value={summary?.transactions_year} loading={loading} />
        <Metric label="Eventos Criticos" value={summary?.critical_events} loading={loading} tone="danger" />
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

const accountTypeLabel: Record<string, string> = { personal: "Aluno", business: "Escola", sub_business: "Professor", system: "Admin" };

function TxParty({ name, fallbackName, accountType, fallbackType }: { name: string | null; fallbackName?: string | null; accountType: string | null; fallbackType?: string | null }) {
  const displayName = name ?? fallbackName ?? "-";
  const displayType = name ? accountType : (fallbackType ?? accountType);
  return <>{displayName}{displayType ? <span className={`pill pill-${displayType}`} style={{ marginLeft: 4 }}>{accountTypeLabel[displayType] ?? displayType}</span> : null}</>;
}

const transactionColumns: Column<LedgerTransaction>[] = [
  { key: "type", header: "tipo" },
  { key: "status", header: "status", render: (row) => <StatusPill value={row.status} /> },
  { key: "from_display_name", header: "origem", render: (row) => (
    <TxParty
      name={row.from_display_name}
      fallbackName={row.created_by_display_name}
      accountType={row.from_account_type}
      fallbackType={row.created_by_account_type}
    />
  )},
  { key: "to_display_name", header: "destino", render: (row) => <TxParty name={row.to_display_name} accountType={row.to_account_type} /> },
  { key: "amount", header: "valor", render: (row) => currency.format(row.amount) },
  { key: "created_at", header: "data", render: (row) => new Date(row.created_at).toLocaleString("pt-BR") }
];

function Metric({ label, value, loading, highlight, tone }: { label: string; value?: number | string | undefined; loading: boolean; highlight?: boolean; tone?: "danger" }) {
  const style: React.CSSProperties = {};
  if (highlight) style.borderLeft = "3px solid var(--gold, #D4A843)";
  if (tone === "danger" && typeof value === "number" && value > 0) style.color = "#EF4444";
  return <div className="card" style={style}><span className="muted">{label}</span><strong>{loading ? "..." : value ?? 0}</strong></div>;
}
