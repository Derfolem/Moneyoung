"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "../../src/components/AdminShell";
import { DataTable, StateMessage, StatusPill, type Column } from "../../src/components/DataTable";
import {
  createOrganization,
  creditOrgWallet,
  deleteOrganization,
  linkOrganizationMember,
  listOrganizations,
  listOrgMembers,
  unlinkOrgMember,
  updateMemberRole,
  updateOrgAccessPin,
  type CreateOrgResult,
  type Organization,
  type OrganizationMemberRole,
  type OrgMember,
} from "../../src/services/admin";

const roleLabel: Record<string, string> = {
  student: "Aluno",
  teacher: "Professor",
  staff: "Funcionario",
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
  const [email, setEmail] = useState("");

  const [createdResult, setCreatedResult] = useState<CreateOrgResult | null>(null);

  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  const [memberYoungKey, setMemberYoungKey] = useState("");
  const [memberRole, setMemberRole] = useState<OrganizationMemberRole>("student");

  const [confirmDelete, setConfirmDelete] = useState<Organization | null>(null);

  const [pinOrg, setPinOrg] = useState<Organization | null>(null);
  const [pinValue, setPinValue] = useState("");

  const [creditOrg, setCreditOrg] = useState<Organization | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [creditDesc, setCreditDesc] = useState("");

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
    setCreatedResult(null);
    try {
      const result = await createOrganization(name.trim(), finalSlug, email.trim() || undefined);
      setCreatedResult(result);
      setName("");
      setSlug("");
      setEmail("");
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
      setNotice(`Escola "${org.name}" excluida.`);
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
      setError("Informe a chave Moneyoung do usuario (ex: @ALN-joao1234).");
      return;
    }
    setBusy("link");
    setError("");
    setNotice("");
    try {
      await linkOrganizationMember(selectedOrg.id, memberYoungKey.trim(), memberRole);
      setMemberYoungKey("");
      setNotice("Usuario vinculado a escola!");
      setMembers(await listOrgMembers(selectedOrg.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao vincular usuario.");
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
      setNotice(`${member.display_name ?? "Usuario"} desvinculado da escola.`);
      if (selectedOrg) setMembers(await listOrgMembers(selectedOrg.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao desvincular usuario.");
    } finally {
      setBusy("");
    }
  }

  async function handleChangeRole(member: OrgMember, newRole: OrganizationMemberRole) {
    setBusy("role");
    setError("");
    setNotice("");
    try {
      await updateMemberRole(member.id, newRole);
      setNotice(`Funcao de ${member.display_name ?? "usuario"} alterada para ${roleLabel[newRole]}.`);
      if (selectedOrg) setMembers(await listOrgMembers(selectedOrg.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao alterar funcao.");
    } finally {
      setBusy("");
    }
  }

  async function handleSavePin() {
    if (!pinOrg) return;
    if (!pinValue.trim() || pinValue.trim().length < 4) {
      setError("O PIN deve ter pelo menos 4 digitos.");
      return;
    }
    setBusy("pin");
    setError("");
    setNotice("");
    try {
      await updateOrgAccessPin(pinOrg.id, pinValue.trim());
      setPinOrg(null);
      setPinValue("");
      setNotice("PIN atualizado com sucesso!");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar PIN.");
    } finally {
      setBusy("");
    }
  }

  async function handleCredit() {
    if (!creditOrg) return;
    const amount = Number(creditAmount);
    if (!amount || amount <= 0) {
      setError("Informe um valor valido.");
      return;
    }
    setBusy("credit");
    setError("");
    setNotice("");
    try {
      await creditOrgWallet(creditOrg.id, amount, creditDesc.trim());
      setCreditOrg(null);
      setCreditAmount("");
      setCreditDesc("");
      setNotice(`${amount} YC creditados para ${creditOrg.name}!`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao creditar YC.");
    } finally {
      setBusy("");
    }
  }

  const columns: Column<Organization>[] = [
    { key: "name", header: "Nome da Escola" },
    {
      key: "email", header: "Email",
      render: (row) => <span className="muted">{row.email || "—"}</span>,
    },
    {
      key: "invite_code_student", header: "Cod. Aluno",
      render: (row) => (
        <code style={{ background: "var(--bg-alt)", padding: "2px 6px", borderRadius: 4, fontSize: "0.85rem" }}>
          {row.invite_code_student || "—"}
        </code>
      ),
    },
    {
      key: "invite_code_staff", header: "Cod. Colaborador",
      render: (row) => (
        <code style={{ background: "var(--bg-alt)", padding: "2px 6px", borderRadius: 4, fontSize: "0.85rem" }}>
          {row.invite_code_staff || "—"}
        </code>
      ),
    },
    {
      key: "status", header: "Status",
      render: (row) => <StatusPill value={row.status} />,
    },
    {
      key: "id", header: "Acoes",
      render: (row) => (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          <button className="secondary" style={{ fontSize: "0.8rem", padding: "4px 10px" }}
            onClick={() => openMembers(row)}>
            Membros
          </button>
          <button style={{ fontSize: "0.8rem", padding: "4px 10px" }}
            onClick={() => { setCreditOrg(row); setCreditAmount(""); setCreditDesc(""); }}>
            Creditar YC
          </button>
          <button className="secondary" style={{ fontSize: "0.8rem", padding: "4px 10px" }}
            onClick={() => { setPinOrg(row); setPinValue(row.access_pin ?? ""); }}>
            PIN
          </button>
          <button className="danger sm"
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
          <br /><small className="muted">{row.young_key ?? ""}</small>
        </div>
      ),
    },
    {
      key: "member_role", header: "Funcao",
      render: (row) => (
        <select
          value={row.member_role}
          onChange={(e) => handleChangeRole(row, e.target.value as OrganizationMemberRole)}
          disabled={busy === "role"}
          style={{ fontSize: "0.85rem", padding: "2px 6px" }}
        >
          <option value="student">Aluno</option>
          <option value="teacher">Professor</option>
          <option value="staff">Funcionario</option>
          <option value="admin">Diretor</option>
        </select>
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
      key: "id", header: "Acao",
      render: (row) => (
        <button className="warning sm"
          onClick={() => handleUnlink(row)}
          disabled={busy === "unlink"}>
          Desvincular
        </button>
      ),
    },
  ];

  return (
    <AdminShell>
      <div className="pageHeader"><h1>Escolas (Organizacoes)</h1></div>
      {notice && <p className="success" style={{ margin: "8px 0" }}>{notice}</p>}
      {error && <StateMessage tone="danger" title="Erro" detail={error} />}

      <section className="panel">
        <h2>Cadastrar Nova Escola</h2>
        <p className="hint">
          Informe o email do colegio e crie a escola. Dois codigos de convite serao gerados automaticamente.
        </p>
        <div className="form">
          <div style={{ flex: 1 }}>
            <label>Nome da escola</label>
            <input
              placeholder="Ex: Colegio VemCer"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Email do colegio</label>
            <input
              placeholder="Ex: contato@colegio.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ flex: 1 }}>
            <label>Identificador (opcional)</label>
            <input
              placeholder="Gerado automaticamente se vazio"
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

      {createdResult && (
        <section className="panel" style={{ marginTop: 16, border: "2px solid var(--success)" }}>
          <h2>Escola Criada — Codigos de Convite</h2>
          <p>Compartilhe estes codigos com a escola para que alunos e colaboradores possam se cadastrar:</p>
          <div style={{ display: "flex", gap: 24, margin: "16px 0", flexWrap: "wrap" }}>
            <div style={{ background: "var(--bg-alt)", padding: "16px 24px", borderRadius: 8, textAlign: "center" }}>
              <small className="muted">Codigo para Alunos</small>
              <div style={{ fontSize: "1.8rem", fontWeight: 700, fontFamily: "monospace", letterSpacing: 2 }}>
                {createdResult.invite_code_student}
              </div>
            </div>
            <div style={{ background: "var(--bg-alt)", padding: "16px 24px", borderRadius: 8, textAlign: "center" }}>
              <small className="muted">Codigo para Colaboradores</small>
              <div style={{ fontSize: "1.8rem", fontWeight: 700, fontFamily: "monospace", letterSpacing: 2 }}>
                {createdResult.invite_code_staff}
              </div>
            </div>
          </div>
          <button className="secondary" onClick={() => setCreatedResult(null)} style={{ fontSize: "0.85rem" }}>
            Fechar
          </button>
        </section>
      )}

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
            <p className="hint">
              Vincule alunos ou professores a esta escola. Use a chave Moneyoung do usuario (ex: @ALN-joao1234).
            </p>
            <div className="form">
              <div style={{ flex: 1 }}>
                <label>Chave Moneyoung do usuario</label>
                <input
                  placeholder="Ex: @ALN-joao1234"
                  value={memberYoungKey}
                  onChange={(e) => setMemberYoungKey(e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label>Funcao na escola</label>
                <select value={memberRole} onChange={(e) => setMemberRole(e.target.value as OrganizationMemberRole)}>
                  <option value="student">Aluno</option>
                  <option value="teacher">Professor</option>
                  <option value="staff">Funcionario</option>
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
            <p className="muted" style={{ textAlign: "center", padding: 16 }}>Nenhum membro vinculado a esta escola.</p>
          )}
        </section>
      )}

      {pinOrg && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div className="panel" style={{ minWidth: 360, maxWidth: 480 }}>
            <h2>PIN de Acesso — {pinOrg.name}</h2>
            <p className="hint">Este PIN protege a aba Alunos na conta dos colaboradores.</p>
            <div style={{ margin: "12px 0" }}>
              <label>PIN (minimo 4 digitos)</label>
              <input
                type="text"
                placeholder="Ex: 1234"
                value={pinValue}
                onChange={(e) => setPinValue(e.target.value.replace(/\D/g, ""))}
                maxLength={8}
                style={{ width: "100%", fontSize: "1.2rem", letterSpacing: 4, textAlign: "center" }}
              />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
              <button className="secondary" onClick={() => setPinOrg(null)}>Cancelar</button>
              <button onClick={handleSavePin} disabled={busy === "pin"}>
                {busy === "pin" ? "Salvando..." : "Salvar PIN"}
              </button>
            </div>
          </div>
        </div>
      )}

      {creditOrg && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div className="panel" style={{ minWidth: 360, maxWidth: 480 }}>
            <h2>Creditar YC — {creditOrg.name}</h2>
            <p className="hint">Insira a quantia de Youngcoins para creditar na conta da escola.</p>
            <div style={{ margin: "12px 0", display: "flex", flexDirection: "column", gap: 8 }}>
              <div>
                <label>Valor (YC)</label>
                <input
                  type="number"
                  placeholder="Ex: 1000"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(e.target.value)}
                  min="1"
                  step="0.01"
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label>Descricao (opcional)</label>
                <input
                  placeholder="Ex: Credito mensal junho"
                  value={creditDesc}
                  onChange={(e) => setCreditDesc(e.target.value)}
                  style={{ width: "100%" }}
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
              <button className="secondary" onClick={() => setCreditOrg(null)}>Cancelar</button>
              <button onClick={handleCredit} disabled={busy === "credit"}>
                {busy === "credit" ? "Creditando..." : "Confirmar Credito"}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
          display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000,
        }}>
          <div className="panel" style={{ minWidth: 360, maxWidth: 480 }}>
            <h2>Excluir Escola</h2>
            <p>Tem certeza que deseja excluir <strong>{confirmDelete.name}</strong>?</p>
            <p style={{ color: "var(--danger)", fontSize: "0.9rem" }}>
              Todos os vinculos de membros serao removidos. Esta acao nao pode ser desfeita.
            </p>
            <div style={{ display: "flex", gap: 8, marginTop: 16, justifyContent: "flex-end" }}>
              <button className="secondary" onClick={() => setConfirmDelete(null)} disabled={busy === "delete"}>Cancelar</button>
              <button className="danger" onClick={() => handleDelete(confirmDelete)} disabled={busy === "delete"}>
                {busy === "delete" ? "Excluindo..." : "Confirmar Exclusao"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
