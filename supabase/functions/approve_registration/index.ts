import { error, json, corsHeaders, parseBody } from "../_shared/http.ts";
import { assertBankAdmin, requireUser, requestMeta } from "../_shared/supabase.ts";

type Body = { profile_id?: string; approved?: boolean; reason?: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return error("METHOD_NOT_ALLOWED", "Use POST.", 405);
  try {
    const { user, serviceClient } = await requireUser(req);
    await assertBankAdmin(serviceClient, user.id);
    const body = await parseBody<Body>(req);

    if (!body.profile_id) return error("INVALID_INPUT", "Informe o profile_id.", 422);
    if (typeof body.approved !== "boolean") return error("INVALID_INPUT", "Informe approved (true/false).", 422);

    const meta = requestMeta(req);
    const { data, error: rpcError } = await serviceClient.rpc("approve_or_reject_registration", {
      p_actor_id: user.id,
      p_profile_id: body.profile_id,
      p_approved: body.approved,
      p_reason: body.reason ?? null,
      p_ip_address: meta.ip_address,
      p_user_agent: meta.user_agent
    });
    if (rpcError) {
      const msg = rpcError.message ?? "";
      if (msg.includes("PROFILE_NOT_FOUND")) return error("NOT_FOUND", "Perfil nao encontrado.", 404);
      if (msg.includes("PROFILE_NOT_PENDING")) return error("INVALID_STATE", "Perfil nao esta pendente.", 422);
      return error("INVALID_INPUT", msg, 422);
    }

    return json({ profile: data, approved: body.approved });
  } catch (err) {
    if (err instanceof Response) return err;
    return error("SERVER_ERROR", err instanceof Error ? err.message : "Erro inesperado.", 500);
  }
});
