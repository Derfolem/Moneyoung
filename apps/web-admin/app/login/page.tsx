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
  const attemptsRef = useRef(0);
  const lockUntilRef = useRef(0);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    requireAdminSession()
      .then((profile) => {
        if (profile) router.replace("/dashboard");
      })
      .catch(() => undefined);
  }, [router]);

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
