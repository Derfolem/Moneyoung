"use client";

import { useEffect, useState } from "react";
import type { Profile, ProfileRole, ProfileStatus } from "@moneyoung/shared";
import { AdminShell } from "../../src/components/AdminShell";
import { DataTable, StatusPill, type Column } from "../../src/components/DataTable";
import { listAccounts } from "../../src/services/admin";

export default function AccountsPage() {
  const [rows, setRows] = useState<Profile[]>([]);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<ProfileRole | "">("");
  const [status, setStatus] = useState<ProfileStatus | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    listAccounts({ query, role, status })
      .then(setRows)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [query, role, status]);

  return (
    <AdminShell>
      <div className="pageHeader"><h1>Contas</h1></div>
      <div className="filters">
        <input placeholder="e-mail ou young_key" value={query} onChange={(e) => setQuery(e.target.value)} />
        <select value={role} onChange={(e) => setRole(e.target.value as ProfileRole | "")}><option value="">Todos roles</option><option>common_user</option><option>organization_admin</option><option>bank_admin</option><option>super_admin</option></select>
        <select value={status} onChange={(e) => setStatus(e.target.value as ProfileStatus | "")}><option value="">Todos status</option><option>active</option><option>blocked</option><option>pending</option></select>
      </div>
      <DataTable rows={rows} columns={columns} loading={loading} error={error} />
    </AdminShell>
  );
}

const accountTypeLabel: Record<string, string> = { personal: "Aluno", business: "Empresa", sub_business: "Professor", system: "Admin" };

const columns: Column<Profile>[] = [
  { key: "email", header: "e-mail" },
  { key: "display_name", header: "nome" },
  { key: "young_key", header: "young key" },
  { key: "account_type", header: "conta", render: (row) => <span className={`pill pill-${row.account_type}`}>{accountTypeLabel[row.account_type] ?? row.account_type}</span> },
  { key: "role", header: "role" },
  { key: "status", header: "status", render: (row) => <StatusPill value={row.status} /> },
  { key: "created_at", header: "criada em", render: (row) => new Date(row.created_at).toLocaleString("pt-BR") }
];
