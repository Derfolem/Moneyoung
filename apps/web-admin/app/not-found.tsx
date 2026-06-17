import Link from "next/link";

export default function NotFound() {
  return (
    <main className="content" style={{ maxWidth: 640, margin: "80px auto" }}>
      <section className="panel">
        <h1>Pagina nao encontrada</h1>
        <p className="muted">O endereco acessado nao existe no painel YoungCoin.</p>
        <Link className="button" href="/dashboard">Voltar ao dashboard</Link>
      </section>
    </main>
  );
}
