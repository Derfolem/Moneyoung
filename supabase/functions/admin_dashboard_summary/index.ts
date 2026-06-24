import { error, json, corsHeaders } from "../_shared/http.ts";
import { assertBankAdmin, requireUser } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { user, serviceClient } = await requireUser(req);
    await assertBankAdmin(serviceClient, user.id);

    const now = new Date();
    const todayStart = now.toISOString().slice(0, 10) + "T00:00:00Z";
    const monthStart = now.toISOString().slice(0, 7) + "-01T00:00:00Z";
    const yearStart = now.getFullYear() + "-01-01T00:00:00Z";

    const [
      walletBalances,
      activeStudents,
      activeSchools,
      txToday,
      txMonth,
      txYear,
      reversals,
      totalWallets,
      blockedWallets,
      criticalEvents,
      latestEnriched,
      txSeries,
    ] = await Promise.all([
      serviceClient.from("wallets").select("balance").eq("status", "active"),
      serviceClient.from("profiles").select("id", { count: "exact", head: true }).eq("account_type", "personal").eq("status", "active"),
      serviceClient.from("profiles").select("id", { count: "exact", head: true }).eq("account_type", "business").eq("status", "active"),
      serviceClient.from("transactions").select("id", { count: "exact", head: true }).gte("created_at", todayStart),
      serviceClient.from("transactions").select("id", { count: "exact", head: true }).gte("created_at", monthStart),
      serviceClient.from("transactions").select("id", { count: "exact", head: true }).gte("created_at", yearStart),
      serviceClient.from("transactions").select("id", { count: "exact", head: true }).eq("type", "reversal"),
      serviceClient.from("wallets").select("id", { count: "exact", head: true }),
      serviceClient.from("wallets").select("id", { count: "exact", head: true }).in("status", ["blocked", "frozen"]),
      serviceClient.from("security_events").select("id", { count: "exact", head: true }).in("severity", ["high", "critical"]),
      serviceClient.from("enriched_transactions").select("*").order("created_at", { ascending: false }).limit(10),
      serviceClient.from("transactions").select("created_at").order("created_at", { ascending: false }).limit(500),
    ]);

    const currentValue = (walletBalances.data ?? []).reduce((sum, w) => sum + Number(w.balance), 0);

    const byDay = (txSeries.data ?? []).reduce<Record<string, number>>((acc, tx) => {
      const day = String(tx.created_at).slice(0, 10);
      acc[day] = (acc[day] ?? 0) + 1;
      return acc;
    }, {});

    return json({
      current_value: currentValue,
      active_students: activeStudents.count ?? 0,
      active_schools: activeSchools.count ?? 0,
      transactions_today: txToday.count ?? 0,
      transactions_month: txMonth.count ?? 0,
      transactions_year: txYear.count ?? 0,
      total_reversals: reversals.count ?? 0,
      total_wallets: totalWallets.count ?? 0,
      blocked_wallets: blockedWallets.count ?? 0,
      critical_events: criticalEvents.count ?? 0,
      transactions_by_day: byDay,
      latest_transactions: latestEnriched.data ?? [],
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return error("SERVER_ERROR", err instanceof Error ? err.message : "Erro inesperado.", 500);
  }
});
