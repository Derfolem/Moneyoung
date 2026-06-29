"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { currency, type LedgerTransaction, type TransactionStatus, type TransactionType } from "@moneyoung/shared";
import { AdminShell } from "../../src/components/AdminShell";
import { StatusPill, StateMessage } from "../../src/components/DataTable";
import { exportCsv, listTransactions, toCsvRows } from "../../src/services/admin";

const accountTypeLabel: Record<string, string> = { personal: "Aluno", business: "Empresa", sub_business: "Professor", system: "Admin" };

export default function TransactionsPage() {
  const [rows, setRows] = useState<LedgerTransaction[]>([]);
  const [status, setStatus] = useState<TransactionStatus | "">("");
  const [type, setType] = useState<TransactionType | "">("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");
  const [walletId, setWalletId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setRows(await listTransactions({ status, type, min, max, walletId }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar transacoes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [status, type, min, max]);

  return (
    <AdminShell>
      <div className="pageHeader"><h1>Transacoes</h1><button onClick={() => exportCsv("moneyoung-transacoes.csv", toCsvRows(rows))} disabled={!rows.length}>Exportar CSV</button></div>
      <div className="filters">
        <select value={status} onChange={(e) => setStatus(e.target.value as TransactionStatus | "")}><option value="">Status</option><option>completed</option><option>failed</option><option>reversed</option><option>pending</option></select>
        <select value={type} onChange={(e) => setType(e.target.value as TransactionType | "")}><option value="">Tipo</option><option>transfer</option><option>payment</option><option>reversal</option><option>initial_credit</option><option>admin_adjustment</option></select>
        <input placeholder="valor minimo" value={min} onChange={(e) => setMin(e.target.value)} />
        <input placeholder="valor maximo" value={max} onChange={(e) => setMax(e.target.value)} />
        <input placeholder="wallet origem/destino" value={walletId} onChange={(e) => setWalletId(e.target.value)} />
        <button className="secondary" onClick={load}>Buscar</button>
      </div>
      {loading ? <StateMessage title="Carregando transacoes..." /> : null}
      {error ? <StateMessage tone="danger" title="Nao foi possivel carregar" detail={error} /> : null}
      {!loading && !error && !rows.length ? <StateMessage title="Nenhuma transacao encontrada." /> : null}
      {!loading && !error && rows.length ? (
        <div className="tableWrap">
          <table>
            <thead><tr><th>tipo</th><th>status</th><th>origem</th><th>destino</th><th>valor</th><th>data</th><th></th></tr></thead>
            <tbody>{rows.map((tx) => (
              <tr key={tx.id}>
                <td>{tx.type}</td>
                <td><StatusPill value={tx.status} /></td>
                <td>
                  {(tx.from_display_name ?? tx.created_by_display_name ?? tx.from_wallet_id ?? "-")}
                  {(tx.from_display_name ? tx.from_account_type : tx.created_by_account_type) && (
                    <span className={`pill pill-${tx.from_display_name ? tx.from_account_type : tx.created_by_account_type}`} style={{ marginLeft: 4 }}>
                      {accountTypeLabel[(tx.from_display_name ? tx.from_account_type : tx.created_by_account_type)!] ?? (tx.from_display_name ? tx.from_account_type : tx.created_by_account_type)}
                    </span>
                  )}
                </td>
                <td>{tx.to_display_name ?? tx.to_wallet_id ?? "-"}{tx.to_account_type ? <span className={`pill pill-${tx.to_account_type}`} style={{ marginLeft: 4 }}>{accountTypeLabel[tx.to_account_type] ?? tx.to_account_type}</span> : null}</td>
                <td>{currency.format(tx.amount)}</td>
                <td>{new Date(tx.created_at).toLocaleString("pt-BR")}</td>
                <td><Link className="button" href={`/transactions/${tx.id}`}>Abrir</Link></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      ) : null}
    </AdminShell>
  );
}
