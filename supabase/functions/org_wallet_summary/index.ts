import { error, json, corsHeaders } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return error("METHOD_NOT_ALLOWED", "Use POST.", 405);
  try {
    const { user, serviceClient } = await requireUser(req);

    const { data: membership, error: memErr } = await serviceClient
      .from("organization_members")
      .select("organization_id, member_role")
      .eq("profile_id", user.id)
      .in("member_role", ["teacher", "staff", "admin"])
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (memErr || !membership) {
      return error("FORBIDDEN", "Voce nao e colaborador ativo de nenhuma organizacao.", 403);
    }

    const orgId = membership.organization_id;

    const { data: wallet } = await serviceClient
      .from("wallets")
      .select("id, balance, status, created_at")
      .eq("organization_id", orgId)
      .eq("wallet_type", "business")
      .maybeSingle();

    if (!wallet) return error("NOT_FOUND", "Wallet da organizacao nao encontrada.", 404);

    const [txRes, membersRes, orgRes] = await Promise.all([
      serviceClient
        .from("enriched_transactions")
        .select("*")
        .or(`from_wallet_id.eq.${wallet.id},to_wallet_id.eq.${wallet.id}`)
        .order("created_at", { ascending: false })
        .limit(50),
      serviceClient
        .from("org_students_with_balance")
        .select("*")
        .eq("organization_id", orgId),
      serviceClient
        .from("organizations")
        .select("id, name, slug, email, access_pin")
        .eq("id", orgId)
        .single()
    ]);

    return json({
      organization: orgRes.data,
      wallet,
      member_role: membership.member_role,
      recent_transactions: txRes.data ?? [],
      members: membersRes.data ?? []
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return error("SERVER_ERROR", err instanceof Error ? err.message : "Erro inesperado.", 500);
  }
});
