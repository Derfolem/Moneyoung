"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { StateMessage } from "../../src/components/DataTable";
import { requireAdminSession } from "../../src/services/admin";
import { isSupabaseConfigured, supabase, supabaseConfigMessage } from "../../src/services/supabase";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 60_000;

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const attemptsRef = useRef(0);
  const lockUntilRef = useRef(0);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === "SIGNED_IN") {
        const profile = await requireAdminSession();
        if (profile) {
          router.replace("/dashboard");
        } else {
          await supabase.auth.signOut();
          setError("Acesso restrito a administradores do banco.");
          setGoogleLoading(false);
        }
      }
    });

    requireAdminSession()
      .then((profile) => {
        if (profile) router.replace("/dashboard");
      })
      .catch(() => undefined);

    return () => subscription.unsubscribe();
  }, [router]);

  async function handleGoogleLogin() {
    if (!isSupabaseConfigured) { setError(supabaseConfigMessage); return; }
    setError("");
    setGoogleLoading(true);

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/login",
      },
    });

    if (oauthError) {
      setError(oauthError.message);
      setGoogleLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (!isSupabaseConfigured) { setError(supabaseConfigMessage); return; }

    const now = Date.now();
    if (now < lockUntilRef.current) {
      const secs = Math.ceil((lockUntilRef.current - now) / 1000);
      setError(`Muitas tentativas. Aguarde ${secs}s.`);
      return;
    }

    const trimEmail = email.trim().toLowerCase();
    const trimPass = password.trim();
    if (!trimEmail || !trimPass) { setError("Preencha email e senha."); return; }

    setError("");
    setLoading(true);

    const { error: authError } = await supabase.auth.signInWithPassword({
      email: trimEmail,
      password: trimPass,
    });

    if (authError) {
      attemptsRef.current++;
      if (attemptsRef.current >= MAX_ATTEMPTS) {
        lockUntilRef.current = Date.now() + LOCKOUT_MS;
        attemptsRef.current = 0;
        setError("Muitas tentativas. Conta bloqueada por 60 segundos.");
      } else {
        setError("Email ou senha incorretos.");
      }
      setLoading(false);
      return;
    }

    const profile = await requireAdminSession();
    if (!profile) {
      await supabase.auth.signOut();
      setError("Acesso restrito a administradores do banco.");
      setLoading(false);
      return;
    }

    attemptsRef.current = 0;
    router.replace("/dashboard");
  }

  return (
    <main className="content" style={{ maxWidth: 420, margin: "120px auto", textAlign: "center" }}>
      <div className="panel" style={{ padding: 32 }}>
        <h1 style={{ fontFamily: "'Josefin Sans', sans-serif", fontSize: 32, marginBottom: 8 }}>MoneYoung</h1>
        <p className="muted" style={{ marginBottom: 24 }}>Painel administrativo</p>

        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={!isSupabaseConfigured || googleLoading}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            background: "#fff",
            color: "#333",
            border: "1px solid #ddd",
            marginBottom: 20,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59a14.5 14.5 0 0 1 0-9.18l-7.98-6.19a24.06 24.06 0 0 0 0 21.56l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
          {googleLoading ? "Entrando..." : "Entrar com Google"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
          <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--border)" }} />
          <span className="muted" style={{ fontSize: 13 }}>ou</span>
          <hr style={{ flex: 1, border: "none", borderTop: "1px solid var(--border)" }} />
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
            style={{ width: "100%" }}
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            style={{ width: "100%" }}
          />
          <button type="submit" disabled={!isSupabaseConfigured || loading} style={{ width: "100%" }}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        {error && (
          <div style={{ marginTop: 16 }}>
            <StateMessage tone="danger" title="Erro" detail={error} />
          </div>
        )}
      </div>
    </main>
  );
}
