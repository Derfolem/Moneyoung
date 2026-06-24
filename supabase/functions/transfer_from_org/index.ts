import { error, json, corsHeaders, parseBody } from "../_shared/http.ts";
import { requireUser, requestMeta } from "../_shared/supabase.ts";

type Body = {
  to_young_key?: string;
  amount?: number;
  description?: string;
  idempotency_key?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return error("METHOD_NOT_ALLOWED", "Use POST.", 405);
  try {
    const { user, serviceClient } = await requireUser(req);
    const body = await parseBody<Body>(req);

    if (!body.to_young_key) return error("INVALID_INPUT", "Informe a chave do destinatario.", 422);
    if (!body.amount || body.amount <= 0) return error("INVALID_INPUT", "Valor invalido.", 422);
    if (!body.idempotency_key || body.idempotency_key.length < 8) {
      return error("INVALID_INPUT", "Chave de idempotencia invalida.", 422);
    }

    const meta = requestMeta(req);
    const { data, error: rpcError } = await serviceClient.rpc("transfer_from_org_wallet", {
      p_actor_id: user.id,
      p_to_young_key: body.to_young_key,
      p_amount: body.amount,
      p_description: body.description ?? null,
      p_idempotency_key: body.idempotency_key,
      p_ip_address: meta.ip_address,
      p_user_agent: meta.user_agent
    });

    if (rpcError) {
      const msg = rpcError.message ?? "";
      if (msg.includes("NOT_A_COLLABORATOR")) return error("FORBIDDEN", "Voce nao e colaborador desta organizacao.", 403);
      if (msg.includes("INSUFFICIENT_FUNDS")) return error("INSUFFICIENT_FUNDS", "Saldo insuficiente na conta da escola.", 422);
      if (msg.includes("DESTINATION_NOT_FOUND")) return error("NOT_FOUND", "Destinatario nao encontrado.", 404);
      if (msg.includes("RATE_LIMITED")) return error("RATE_LIMITED", "Muitas transferencias. Aguarde.", 429);
      return error("INVALID_INPUT", msg, 422);
    }

    return json({ transaction: data });
  } catch (err) {
    if (err instanceof Response) return err;
    return error("SERVER_ERROR", err instanceof Error ? err.message : "Erro inesperado.", 500);
  }
});
