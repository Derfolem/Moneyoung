"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "../../src/components/AdminShell";
import { DataTable, type Column } from "../../src/components/DataTable";
import { exportCsv, listAuditLogs, toCsvRows, type AuditLog } from "../../src/services/admin";

export default function AuditPage() {
  const [rows, setRows] = useState<AuditLog[]>([]);
  const [action, setAction] = useState("");
  const [entityType, setEntityType] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    listAuditLogs({ action, entityType })
      .then(setRows)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [action, entityType]);

  return (
    <AdminShell>
      <div className="pageHeader"><h1>Auditoria</h1><button onClick={() => exportCsv("youngcoin-auditoria.csv", toCsvRows(rows))} disabled={!rows.length}>Exportar CSV</button></div>
      <div className="filters">
        <input placeholder="acao" value={action} onChange={(e) => setAction(e.target.value)} />
        <input placeholder="entidade" value={entityType} onChange={(e) => setEntityType(e.target.value)} />
      </div>
      <DataTable rows={rows} columns={columns} loading={loading} error={error} />
    </AdminShell>
  );
}

const columns: Column<AuditLog>[] = [
  { key: "created_at", header: "data", render: (row) => new Date(row.created_at).toLocaleString("pt-BR") },
  { key: "action", header: "acao" },
  { key: "entity_type", header: "entidade" },
  { key: "entity_id", header: "id entidade" },
  { key: "actor_profile_id", header: "admin" },
  { key: "metadata", header: "metadata", render: (row) => JSON.stringify(row.metadata ?? {}) }
];
