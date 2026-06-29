"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "../../src/components/AdminShell";
import { StateMessage } from "../../src/components/DataTable";
import { listClientErrors, type ClientErrorReport } from "../../src/services/admin";

const platformLabel: Record<string, string> = { mobile: "Mobile", web: "Web" };

export default function AlertsPage() {
  const [rows, setRows] = useState<ClientErrorReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterPlatform, setFilterPlatform] = useState("");
  const [filterScreen, setFilterScreen] = useState("");

  useEffect(() => {
    listClientErrors()
      .then(setRows)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const filtered = rows.filter((r) => {
    if (filterPlatform && r.platform !== filterPlatform) return false;
    if (filterScreen && !(r.screen ?? "").toLowerCase().includes(filterScreen.toLowerCase())) return false;
    return true;
  });

  return (
    <AdminShell>
      <div className="pageHeader">
        <h1>Alertas do App</h1>
        <span className="muted" style={{ fontSize: 13 }}>
          Erros reportados automaticamente pelo app
        </span>
      </div>

      {error ? <StateMessage tone="danger" title="Nao foi possivel carregar" detail={error} /> : null}

      <div className="filters">
        <select value={filterPlatform} onChange={(e) => setFilterPlatform(e.target.value)}>
          <option value="">Plataforma</option>
          <option value="mobile">Mobile</option>
          <option value="web">Web</option>
        </select>
        <input
          placeholder="Filtrar por tela"
          value={filterScreen}
          onChange={(e) => setFilterScreen(e.target.value)}
        />
      </div>

      {loading ? <StateMessage title="Carregando alertas..." /> : null}
      {!loading && !error && !filtered.length ? <StateMessage title="Nenhum erro registrado." /> : null}

      {!loading && !error && filtered.length ? (
        <div className="tableWrap">
          <table>
            <thead>
              <tr>
                <th>data</th>
                <th>plataforma</th>
                <th>tela</th>
                <th>acao</th>
                <th>codigo</th>
                <th>mensagem</th>
                <th>usuario</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{new Date(r.created_at).toLocaleString("pt-BR")}</td>
                  <td>
                    <span className="pill" style={{ background: r.platform === "mobile" ? "rgba(99,102,241,0.15)" : "rgba(20,184,166,0.15)", color: r.platform === "mobile" ? "#818cf8" : "#2dd4bf" }}>
                      {platformLabel[r.platform] ?? r.platform}
                    </span>
                  </td>
                  <td>{r.screen ?? "-"}</td>
                  <td>{r.action ?? "-"}</td>
                  <td>
                    {r.error_code ? (
                      <span className="pill pill-danger" style={{ fontFamily: "monospace", fontSize: 11 }}>
                        {r.error_code}
                      </span>
                    ) : "-"}
                  </td>
                  <td style={{ maxWidth: 320, wordBreak: "break-word" }}>{r.error_message}</td>
                  <td style={{ fontFamily: "monospace", fontSize: 11 }}>{r.profile_id ? r.profile_id.slice(0, 8) + "…" : "anon"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </AdminShell>
  );
}
