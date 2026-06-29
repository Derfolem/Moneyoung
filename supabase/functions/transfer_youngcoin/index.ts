import { error, json, corsHeaders, parseBody } from "../_shared/http.ts";
import { requireUser, requestMeta, assertActiveProfile } from "../_shared/supabase.ts";

type Body = {
  to_young_key?: string;
  amount?: number;
  description?: string;
  idempotency_key?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return error("METHOD_NOT_ALLOWED", "Use POST para transferencias.", 405);
  try {
    const { user, serviceClient } = await requireUser(req);
    await assertActiveProfile(serviceClient, user.id);
    const body = await parseBody<Body>(req);
    const amount = Number(body.amount);
    const toYoungKey = body.to_young_key?.trim().toLowerCase();
    const idempotencyKey = body.idempotency_key?.trim();

    if (!toYoungKey || !idempotencyKey || !Number.isFinite(amount)) {
      return error("INVALID_INPUT", "Informe destinatario, valor e chave de idempotencia.", 422);
    }
    if (idempotencyKey.length < 8) return error("INVALID_INPUT", "Chave de idempotencia invalida.", 422);
    if (amount <= 0 || amount !== Math.round(amount * 100) / 100) {
      return error("INVALID_INPUT", "Valor deve ser positivo e ter no maximo 2 casas decimais.", 422);
    }

    const meta = requestMeta(req);
    const { data, error: rpcError } = await serviceClient.rpc("transfer_youngcoin_tx", {
      p_actor_id: user.id,
      p_to_young_key: toYoungKey,
      p_amount: amount,
      p_description: body.description ?? null,
      p_idempotency_key: idempotencyKey,
      p_ip_address: meta.ip_address,
      p_user_agent: meta.user_agent
    });

    if (rpcError) {
      const msg = rpcError.message ?? "";
      if (msg.includes("PEER_TRANSFER_BLOCKED")) return error("PEER_TRANSFER_BLOCKED", "Transferencias entre alunos nao sao permitidas. Envie para a chave da escola ou de um colaborador.", 403);
      if (msg.includes("DESTINATION_WALLET_NOT_FOUND")) return error("NOT_FOUND", "Destinatario nao encontrado ou sem carteira ativa.", 404);
      if (msg.includes("DESTINATION_NOT_FOUND")) return error("NOT_FOUND", "Destinatario nao encontrado.", 404);
      if (msg.includes("INSUFFICIENT_FUNDS")) return error("INSUFFICIENT_FUNDS", "Saldo insuficiente.", 422);
      if (msg.includes("RATE_LIMITED")) return error("RATE_LIMITED", "Muitas transferencias. Aguarde.", 429);
      if (msg.includes("TRANSACTION_LIMIT_EXCEEDED")) return error("LIMIT_EXCEEDED", "Valor acima do limite por transacao.", 422);
      if (msg.includes("DAILY_LIMIT_EXCEEDED")) return error("LIMIT_EXCEEDED", "Limite diario atingido.", 422);
      return error("INVALID_INPUT", msg, 422);
    }
    return json({ transaction: data });
  } catch (err) {
    if (err instanceof Response) return err;
    return error("SERVER_ERROR", err instanceof Error ? err.message : "Erro inesperado.", 500);
  }
});
