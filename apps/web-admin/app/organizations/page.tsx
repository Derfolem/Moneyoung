"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "../../src/components/AdminShell";
import { DataTable, StateMessage, StatusPill, type Column } from "../../src/components/DataTable";
import {
  createOrganization,
  deleteOrganization,
  linkOrganizationMember,
  listOrganizations,
  listOrgMembers,
  unlinkOrgMember,
  type Organization,
  type OrganizationMemberRole,
  type OrgMember,
} from "../../src/services/admin";

const roleLabel: Record<string, string> = {
  student: "Aluno",
  teacher: "Professor",
  staff: "Funcionário",
  admin: "Diretor",
};

export default function OrganizationsPage() {
  const [rows, setRows] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState("");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const [memberYoungKey, setMemberYoungKey] = useState("");
  const [memberRole, setMemberRole] = useState<OrganizationMemberRole>("student");

  const [confirmDelete, setConfirmDelete] = useState<Organization | null>(null);

  async function load() {
    setLoading(true);
    setError("");
    try {
      setRows(await listOrganizations());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar escolas.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate() {
    if (!name.trim()) {
      setError("Informe o nome da escola.");
      return;
    }
    const finalSlug = slug.trim() || name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    setBusy("create");
    setError("");
    setNotice("");
    try {
      await createOrganization(name.trim(), finalSlug);
      setName("");
      setSlug("");
      setNotice("Escola criada com sucesso!");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar escola.");
    } finally {
      setBusy("");
    }
  }

  async function handleDelete(org: Organization) {
    setBusy("delete");
    setError("");
    setNotice("");
    try {
      await deleteOrganization(org.id);
      setConfirmDelete(null);
      if (selectedOrg?.id === org.id) {
        setSelectedOrg(null);
        setMembers([]);
      }
      setNotice(`Escola "${org.name}" excluída.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir escola.");
    } finally {
      setBusy("");
    }
  }

  async function openMembers(org: Organization) {
    setSelectedOrg(org);
    setMembersLoading(true);
    setError("");
    try {
      setMembers(await listOrgMembers(org.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar membros.");
    } finally {
      setMembersLoading(false);
    }
  }

  async function handleLink() {
    if (!selectedOrg) return;
    if (!memberYoungKey.trim()) {
      setError("Informe a chave Moneyoung do usuário (ex: @ALN-joao1234).");
      return;
    }
    setBusy("link");
    setError("");
    setNotice("");
    try {
      await linkOrganizationMember(selectedOrg.id, memberYoungKey.trim(), memberRole);
      setMemberYoungKey("");
      setNotice("Usuário vinculado à escola!");
      setMembers(await listOrgMembers(selectedOrg.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao vincular usuário.");
    } finally {
      setBusy("");
    }
  }

  async function handleUnlink(member: OrgMember) {
    setBusy("unlink");
    setError("");
    setNotice("");
    try {
      await unlinkOrgMember(member.id);
      setNotice(`${member.display_name ?? "Usuário"} desvinculado da escola.`);
      if (selectedOrg) setMembers(await listOrgMembers(selectedOrg.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao desvincular usuário.");
    } finally {
      setBusy("");
    }
  }

  const columns: Column<Organization>[] = [
    { key: "name", header: "Nome da Escola" },
    { key: "slug", header: "Identificador" },
    {
      key: "status", header: "Status",
      render: (row) => <StatusPill value={row.status} />,
    },
    {
      key: "created_at", header: "Criada em",
      render: (row) => new Date(row.created_at).toLocaleString("pt-BR"),
    },
    {
      key: "id", header: "Ações",
      render: (row) => (
        <div style={{ display: "flex", gap: 6 }}>
          <button className="secondary" style={{ fontSize: "0.8rem", padding: "4px 10px" }}
            onClick={() => openMembers(row)}>
            Membros
          </button>
          <button style={{ fontSize: "0.8rem", padding: "4px 10px", background: "#c62828", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
            onClick={() => setConfirmDelete(row)}>
            Excluir
          </button>
        </div>
      ),
    },
  ];

  const memberColumns: Column<OrgMember>[] = [
    {
      key: "display_name", header: "Nome",
      render: (row) => (
        <div>
          <strong>{row.display_name ?? "—"}</strong>
          <br /><small style={{ color: "#666" }}>{row.young_key ?? ""}</small>
        </div>
      ),
    },
    {
      key: "member_role", header: "Função",
      render: (row) => (
        <span className={`pill pill-${row.account_type ?? "personal"}`}>
          {roleLabel[row.member_role] ?? row.member_role}
        </span>
      ),
    },
    {
      key: "status", header: "Status",
      render: (row) => <StatusPill value={row.status} />,
    },
    {
      key: "created_at", header: "Vinculado em",
      render: (row) => new Date(row.created_at).toLocaleString("pt-BR"),
    },
    {
      key: "id", header: "Ação",
      render: (row) => (
        <button style={{ fontSize: "0.8rem", padding: "4px 10px", background: "#e65100", color: "#fff", border: "none", borderRadius: 4, cursor: "pointer" }}
          onClick={() => handleUnlink(row)}
          disabled={busy === "unlink"}>
          Desvincular
        </button>
      ),
    },
  ];

  return (
    <AdminShell>
      <div className="pageHeader"><h1>Escolas (Organizações)</h1></div>
      {notice && <p className="success" style={{ margin: "8px 0" }}>{notice}</p>}
      {error && <StateMessage tone="danger" title="Erro" detail={error} />}

      <section className="panel">
        <h2>Cadastrar Nova Escola</h2>
        <p style={{ fontSize: "0.9rem", color: "#666", margin: "4px 0 12px" }}>
          Crie um colégio para poder vincular alunos e professores a ele e distribuir Youngcoins.
        </p>
        <div className="form">
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "0.8rem", color: "#888" }}>Nome da escola</label>
            <input
              placeholder="Ex: Colégio VemCer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ fontSize: "0.8rem", color: "#888" }}>Identificador (opcional)</label>
            <input
              placeholder="Ex: vemcer (gerado automaticamente se vazio)"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
          <button onClick={handleCreate} disabled={busy === "create"} style={{ alignSelf: "flex-end" }}>
            {busy === "create" ? "Criando..." : "Criar Escola"}
          </button>
        </div>
      </section>

      <h2 style={{ marginTop: 24 }}>Escolas Cadastradas</h2>
      <DataTable rows={rows} columns={columns} loading={loading} error={loading ? undefined : error} />

      {selectedOrg && (
        <section className="panel" style={{ marginTop: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>Membros — {selectedOrg.name}</h2>
            <button className="secondary" style={{ fontSize: "0.8rem" }} onClick={() => { setSelectedOrg(null); setMembers([]); }}>
              Fechar
            </button>
          </div>

          <div style={{ margin: "12px 0" }}>
            <p style={{ fontSize: "0.9rem", color: "#666", margin: "4px 0 8px" }}>
              Vincule alunos ou professores a esta escola. Use a chave Moneyoung do usuário (ex: @ALN-joao1234).
            </p>
            <div className="form">
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "0.8rem", color: "#888" }}>Chave Moneyoung do usuário</label>
                <input
                  placeholder="Ex: @ALN-joao1234"
                  value={memberYoungKey}
                  onChange={(e) => setMemberYoungKey(e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "0.8rem", color: "#888" }}>Função na escola</label>
                <select value={memberRole} onChange={(e) => setMemberRole(e.target.value as OrganizationMemberRole)}>
                  <option value="student">Aluno</option>
                  <option value="teacher">Professor</option>
                  <option value="staff">Funcionário</option>
                  <option value="admin">Diretor</option>
                </select>
              </div>
              <button onClick={handleLink} disabled={busy === "link"} style={{ alignSelf: "flex-end" }}>
                {busy === "link" ? "Vinculando..." : "Vincular"}
              </button>
            </div>
          </div>

          <DataTable rows={members} columns={memberColumns} loading={membersLoading} />
          {!membersLoading && members.length === 0 && (
            <p style={{ textAlign: "center", color: "#888", padding: 16 }}>Nenhum membro vinculado a esta escola.</p>
          )}
        </section>
      )}

      {confirmDelete && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div className="panel" style={{ minWidth: 360, maxWidth: 480 }}>
            <h2>Excluir Escola</h2>
            <p>Tem certeza que deseja excluir <strong>{confirmDelete.name}</strong>?</p>
            <p style={{ color: "#c62828", fontSize: "0.9rem" }}>
              Todos os vínculos de membros serão removidos. Esta ação não pode ser desfeita.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
              <button className="secondary" onClick={() => setConfirmDelete(null)} disabled={busy === "delete"}>Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete)} disabled={busy === "delete"}
                style={{ background: "#c62828", color: "#fff" }}>
                {busy === "delete" ? "Excluindo..." : "Confirmar Exclusão"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
