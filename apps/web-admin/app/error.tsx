"use client";

import Link from "next/link";

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <main className="content" style={{ maxWidth: 640, margin: "80px auto" }}>
      <section className="panel">
        <h1>Erro no painel</h1>
        <p className="muted">{error.message || "Nao foi possivel carregar esta tela."}</p>
        <div className="filters">
          <button onClick={reset}>Tentar novamente</button>
          <Link className="button" href="/dashboard">Voltar ao dashboard</Link>
        </div>
      </section>
    </main>
  );
}
