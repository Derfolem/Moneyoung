"use client";

import { useEffect, useState } from "react";
import type { SecuritySeverity } from "@moneyoung/shared";
import { AdminShell } from "../../src/components/AdminShell";
import { DataTable, StatusPill, type Column } from "../../src/components/DataTable";
import { listSecurityEvents, type SecurityEvent } from "../../src/services/admin";

export default function SecurityEventsPage() {
  const [rows, setRows] = useState<SecurityEvent[]>([]);
  const [severity, setSeverity] = useState<SecuritySeverity | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    listSecurityEvents({ severity })
      .then(setRows)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [severity]);

  return (
    <AdminShell>
      <div className="pageHeader"><h1>Eventos de seguranca</h1></div>
      <div className="filters"><select value={severity} onChange={(e) => setSeverity(e.target.value as SecuritySeverity | "")}><option value="">Todas severidades</option><option>low</option><option>medium</option><option>high</option><option>critical</option></select></div>
      <DataTable rows={rows} columns={columns} loading={loading} error={error} />
    </AdminShell>
  );
}

const columns: Column<SecurityEvent>[] = [
  { key: "created_at", header: "data", render: (row) => new Date(row.created_at).toLocaleString("pt-BR") },
  { key: "severity", header: "severidade", render: (row) => <StatusPill value={row.severity} /> },
  { key: "event_type", header: "evento" },
  { key: "profile_id", header: "profile" },
  { key: "metadata", header: "metadata", render: (row) => JSON.stringify(row.metadata ?? {}) }
];
