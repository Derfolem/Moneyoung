"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StateMessage } from "../../src/components/DataTable";
import { requireAdminSession } from "../../src/services/admin";
import { isSupabaseConfigured, supabase, supabaseConfigMessage } from "../../src/services/supabase";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    requireAdminSession()
      .then((profile) => {
        if (profile) router.replace("/dashboard");
      })
      .catch(() => undefined);
  }, [router]);

  async function login() {
    if (!isSupabaseConfigured) {
      setError(supabaseConfigMessage);
      return;
    }
    setError("");
    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/dashboard` }
    });
    setLoading(false);
    if (authError) setError(authError.message);
  }

  return (
    <main className="content" style={{ maxWidth: 520, margin: "80px auto" }}>
      <div className="panel">
        <h1>YoungCoin Bank</h1>
        <p className="muted">Acesso administrativo via Google OAuth. Apenas bank_admin e super_admin entram no painel.</p>
        {!isSupabaseConfigured ? <p className="muted">{supabaseConfigMessage}</p> : null}
        <button onClick={login} disabled={!isSupabaseConfigured || loading}>{loading ? "Redirecionando..." : "Entrar com Google"}</button>
        {error ? <StateMessage tone="danger" title="Login indisponivel" detail={error} /> : null}
      </div>
    </main>
  );
}
