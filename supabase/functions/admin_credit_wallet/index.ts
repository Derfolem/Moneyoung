import { error, json, corsHeaders, parseBody } from "../_shared/http.ts";
import { assertBankAdmin, requireUser, requestMeta } from "../_shared/supabase.ts";

type Body = { wallet_id?: string; amount?: number; description?: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return error("METHOD_NOT_ALLOWED", "Use POST.", 405);
  try {
    const { user, serviceClient } = await requireUser(req);
    await assertBankAdmin(serviceClient, user.id);
    const body = await parseBody<Body>(req);

    if (!body.wallet_id) return error("INVALID_INPUT", "Informe o wallet_id.", 422);
    if (!body.amount || body.amount <= 0) return error("INVALID_INPUT", "Valor invalido.", 422);

    const meta = requestMeta(req);
    const { data, error: rpcError } = await serviceClient.rpc("admin_credit_wallet", {
      p_actor_id: user.id,
      p_wallet_id: body.wallet_id,
      p_amount: body.amount,
      p_description: body.description ?? "Credito administrativo",
      p_ip_address: meta.ip_address,
      p_user_agent: meta.user_agent,
    });
    if (rpcError) return error("INVALID_INPUT", rpcError.message, 422);

    return json({ transaction: data });
  } catch (err) {
    if (err instanceof Response) return err;
    return error("SERVER_ERROR", err instanceof Error ? err.message : "Erro inesperado.", 500);
  }
});
