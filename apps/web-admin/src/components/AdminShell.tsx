"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { LayoutDashboard, Users, WalletCards, ReceiptText, School, ShieldAlert, FileSearch, SlidersHorizontal, Settings } from "lucide-react";
import { requireAdminSession } from "../services/admin";
import { isSupabaseConfigured, supabaseConfigMessage } from "../services/supabase";
import { StateMessage } from "./DataTable";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/accounts", label: "Contas", icon: Users },
  { href: "/wallets", label: "Wallets", icon: WalletCards },
  { href: "/transactions", label: "Transacoes", icon: ReceiptText },
  { href: "/organizations", label: "Organizacoes", icon: School },
  { href: "/audit", label: "Auditoria", icon: FileSearch },
  { href: "/security-events", label: "Seguranca", icon: ShieldAlert },
  { href: "/limits", label: "Limites", icon: SlidersHorizontal },
  { href: "/settings", label: "Ajustes", icon: Settings }
];

export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    requireAdminSession()
      .then((profile) => {
        if (!profile) router.replace("/login");
        else setReady(true);
      })
      .catch((err: Error) => setError(err.message));
  }, [router]);

  if (!isSupabaseConfigured) {
    return (
      <main className="content" style={{ maxWidth: 720, margin: "80px auto" }}>
        <section className="panel">
          <h1>Configuracao pendente</h1>
          <p className="muted">{supabaseConfigMessage}</p>
          <pre>{`NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-chave-anon`}</pre>
        </section>
      </main>
    );
  }

  if (error) return <main className="loading"><StateMessage tone="danger" title="Falha ao validar acesso" detail={error} /></main>;

  if (!ready) return <main className="loading"><StateMessage title="Validando acesso..." /></main>;

  return (
    <div className="shell">
      <aside className="sidebar">
        <strong className="brand">YoungCoin Bank</strong>
        <nav>
          {nav.map((item) => {
            const Icon = item.icon;
            return <Link key={item.href} className={pathname.startsWith(item.href) ? "active" : ""} href={item.href}><Icon size={18} />{item.label}</Link>;
          })}
        </nav>
      </aside>
      <main className="content">{children}</main>
    </div>
  );
}
