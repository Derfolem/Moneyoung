import { error, json, corsHeaders, parseBody } from "../_shared/http.ts";
import { assertBankAdmin, requireUser, requestMeta } from "../_shared/supabase.ts";

type Body = { wallet_id?: string; status?: "active" | "blocked" | "frozen"; reason?: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return error("METHOD_NOT_ALLOWED", "Use POST para alterar status de wallet.", 405);
  try {
    const { user, serviceClient } = await requireUser(req);
    await assertBankAdmin(serviceClient, user.id);
    const body = await parseBody<Body>(req);
    if (!body.wallet_id || !body.status) return error("INVALID_INPUT", "Informe wallet e status.", 422);
    const meta = requestMeta(req);

    const { data, error: rpcError } = await serviceClient.rpc("block_wallet_tx", {
      p_actor_id: user.id,
      p_wallet_id: body.wallet_id,
      p_status: body.status,
      p_reason: body.reason ?? null,
      p_ip_address: meta.ip_address,
      p_user_agent: meta.user_agent
    });

    if (rpcError) return error("INVALID_INPUT", rpcError.message, 422);
    return json({ wallet: data });
  } catch (err) {
    if (err instanceof Response) return err;
    return error("SERVER_ERROR", err instanceof Error ? err.message : "Erro inesperado.", 500);
  }
});
