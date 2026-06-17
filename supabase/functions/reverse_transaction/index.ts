import { error, json, corsHeaders, parseBody } from "../_shared/http.ts";
import { assertBankAdmin, requireUser, requestMeta } from "../_shared/supabase.ts";

type Body = { transaction_id?: string; reason?: string; idempotency_key?: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return error("METHOD_NOT_ALLOWED", "Use POST para estornos.", 405);
  try {
    const { user, serviceClient } = await requireUser(req);
    await assertBankAdmin(serviceClient, user.id);
    const body = await parseBody<Body>(req);
    const idempotencyKey = body.idempotency_key?.trim();
    if (!body.transaction_id || !idempotencyKey) return error("INVALID_INPUT", "Informe transacao e idempotency_key.", 422);
    if (idempotencyKey.length < 8) return error("INVALID_INPUT", "Chave de idempotencia invalida.", 422);
    const meta = requestMeta(req);

    const { data, error: rpcError } = await serviceClient.rpc("reverse_transaction_tx", {
      p_actor_id: user.id,
      p_transaction_id: body.transaction_id,
      p_reason: body.reason ?? "Estorno administrativo",
      p_idempotency_key: idempotencyKey,
      p_ip_address: meta.ip_address,
      p_user_agent: meta.user_agent
    });

    if (rpcError) return error("INVALID_INPUT", rpcError.message, 422);
    return json({ transaction: data });
  } catch (err) {
    if (err instanceof Response) return err;
    return error("SERVER_ERROR", err instanceof Error ? err.message : "Erro inesperado.", 500);
  }
});
