import { error, json, corsHeaders } from "../_shared/http.ts";
import { assertBankAdmin, requireUser } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { user, serviceClient } = await requireUser(req);
    await assertBankAdmin(serviceClient, user.id);

    const [profiles, wallets, transactions, latestEnriched, blockedWallets, suspicious] = await Promise.all([
      serviceClient.from("profiles").select("id", { count: "exact", head: true }),
      serviceClient.from("wallets").select("id", { count: "exact", head: true }),
      serviceClient.from("transactions").select("id,amount,created_at,status,type").order("created_at", { ascending: false }).limit(500),
      serviceClient.from("enriched_transactions").select("*").order("created_at", { ascending: false }).limit(10),
      serviceClient.from("wallets").select("id", { count: "exact", head: true }).in("status", ["blocked", "frozen"]),
      serviceClient.from("security_events").select("id", { count: "exact", head: true }).in("severity", ["high", "critical"])
    ]);

    const txs = transactions.data ?? [];
    const volume = txs.filter((tx) => tx.status === "completed").reduce((sum, tx) => sum + Number(tx.amount), 0);
    const byDay = txs.reduce<Record<string, number>>((acc, tx) => {
      const day = String(tx.created_at).slice(0, 10);
      acc[day] = (acc[day] ?? 0) + 1;
      return acc;
    }, {});

    return json({
      total_accounts: profiles.count ?? 0,
      total_wallets: wallets.count ?? 0,
      total_transactions: txs.length,
      total_volume: volume,
      transactions_by_day: byDay,
      blocked_wallets: blockedWallets.count ?? 0,
      suspicious_transactions: suspicious.count ?? 0,
      latest_transactions: latestEnriched.data ?? []
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return error("SERVER_ERROR", err instanceof Error ? err.message : "Erro inesperado.", 500);
  }
});
