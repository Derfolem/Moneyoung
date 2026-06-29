import { error, json, corsHeaders } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { user, serviceClient } = await requireUser(req);
    const { data: profile, error: profileError } = await serviceClient
      .from("profiles")
      .select("id,email,display_name,avatar_url,young_key,account_type,role,status")
      .eq("id", user.id)
      .single();
    if (profileError) return error("NOT_FOUND", "Profile Moneyoung nao encontrado.", 404);
    if (profile.status === "deleted") return error("ACCOUNT_DELETED", "Esta conta foi desativada.", 403);

    const { data: wallet, error: walletError } = await serviceClient
      .from("wallets")
      .select("id,balance,status,wallet_type")
      .eq("profile_id", user.id)
      .single();
    if (walletError) return error("NOT_FOUND", "Wallet Moneyoung nao encontrada.", 404);

    const { data: recent_transactions, error: txError } = await serviceClient
      .from("enriched_transactions")
      .select("*")
      .or(`from_wallet_id.eq.${wallet.id},to_wallet_id.eq.${wallet.id}`)
      .order("created_at", { ascending: false })
      .limit(20);
    if (txError) return error("SERVER_ERROR", txError.message, 500);

    return json({ profile, wallet, recent_transactions });
  } catch (err) {
    if (err instanceof Response) return err;
    return error("SERVER_ERROR", err instanceof Error ? err.message : "Erro inesperado.", 500);
  }
});
