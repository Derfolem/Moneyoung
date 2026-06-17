"use client";

import { AdminShell } from "../../src/components/AdminShell";
import { isSupabaseConfigured, supabase, supabaseConfigMessage } from "../../src/services/supabase";

export default function SettingsPage() {
  return (
    <AdminShell>
      <div className="pageHeader"><h1>Ajustes</h1></div>
      <section className="panel">
        <h2>Ambiente</h2>
        <p className="muted">OAuth, Supabase, Vercel e EAS sao configurados por variaveis de ambiente e consoles dos provedores.</p>
        <p><strong>Supabase:</strong> {isSupabaseConfigured ? "configurado" : supabaseConfigMessage}</p>
        <button className="danger" onClick={() => supabase.auth.signOut().then(() => location.href = "/login")}>Sair</button>
      </section>
    </AdminShell>
  );
}
