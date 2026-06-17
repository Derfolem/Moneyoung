"use client";

import { useEffect, useState } from "react";
import { AdminShell } from "../../src/components/AdminShell";
import { DataTable, StateMessage, StatusPill, type Column } from "../../src/components/DataTable";
import {
  createOrganization,
  linkOrganizationMember,
  listOrganizations,
  type Organization,
  type OrganizationMemberRole
} from "../../src/services/admin";

export default function OrganizationsPage() {
  const [rows, setRows] = useState<Organization[]>([]);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [profileId, setProfileId] = useState("");
  const [memberOrg, setMemberOrg] = useState("");
  const [memberProfile, setMemberProfile] = useState("");
  const [memberRole, setMemberRole] = useState<OrganizationMemberRole>("student");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setRows(await listOrganizations());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar organizacoes.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function createOrg() {
    if (!name.trim() || !slug.trim()) {
      setError("Informe nome e slug.");
      return;
    }
    setBusy("create");
    setError("");
    setNotice("");
    try {
      await createOrganization(name.trim(), slug.trim(), profileId.trim() || undefined);
      setName("");
      setSlug("");
      setProfileId("");
      setNotice("Organizacao criada.");
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar organizacao.");
    } finally {
      setBusy("");
    }
  }

  async function linkMember() {
    if (!memberOrg.trim() || !memberProfile.trim()) {
      setError("Informe organization_id e profile_id.");
      return;
    }
    setBusy("member");
    setError("");
    setNotice("");
    try {
      await linkOrganizationMember(memberOrg.trim(), memberProfile.trim(), memberRole);
      setMemberOrg("");
      setMemberProfile("");
      setNotice("Usuario vinculado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao vincular usuario.");
    } finally {
      setBusy("");
    }
  }

  return (
    <AdminShell>
      <div className="pageHeader"><h1>Organizacoes</h1></div>
      {notice ? <p className="success">{notice}</p> : null}
      {error ? <StateMessage tone="danger" title="Operacao nao concluida" detail={error} /> : null}
      <section className="panel"><h2>Criar escola</h2><div className="form"><input placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} /><input placeholder="slug" value={slug} onChange={(e) => setSlug(e.target.value)} /><input placeholder="owner_profile_id opcional" value={profileId} onChange={(e) => setProfileId(e.target.value)} /><button onClick={createOrg} disabled={busy === "create"}>{busy === "create" ? "Criando..." : "Criar"}</button></div></section>
      <section className="panel" style={{ marginTop: 16 }}><h2>Vincular usuario</h2><div className="form"><input placeholder="organization_id" value={memberOrg} onChange={(e) => setMemberOrg(e.target.value)} /><input placeholder="profile_id" value={memberProfile} onChange={(e) => setMemberProfile(e.target.value)} /><select value={memberRole} onChange={(e) => setMemberRole(e.target.value as OrganizationMemberRole)}><option>student</option><option>teacher</option><option>staff</option><option>admin</option></select><button onClick={linkMember} disabled={busy === "member"}>{busy === "member" ? "Vinculando..." : "Vincular"}</button></div></section>
      <h2>Escolas</h2>
      <DataTable rows={rows} columns={columns} loading={loading} error={loading ? undefined : error} />
    </AdminShell>
  );
}

const columns: Column<Organization>[] = [
  { key: "name", header: "nome" },
  { key: "slug", header: "slug" },
  { key: "owner_profile_id", header: "owner" },
  { key: "status", header: "status", render: (row) => <StatusPill value={row.status} /> },
  { key: "created_at", header: "criada em", render: (row) => new Date(row.created_at).toLocaleString("pt-BR") }
];
