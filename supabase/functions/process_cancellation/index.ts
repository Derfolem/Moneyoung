import { error, json, corsHeaders, parseBody } from "../_shared/http.ts";
import { assertBankAdmin, requireUser, requestMeta } from "../_shared/supabase.ts";

type Body = { profile_id?: string; approved?: boolean };

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
    const { data, error: rpcError } = await serviceClient.rpc("process_cancellation", {
      p_actor_id: user.id,
      p_profile_id: body.profile_id,
      p_approved: body.approved,
      p_ip_address: meta.ip_address,
      p_user_agent: meta.user_agent,
    });
    if (rpcError) return error("INVALID_INPUT", rpcError.message, 422);

    return json({ profile: data });
  } catch (err) {
    if (err instanceof Response) return err;
    return error("SERVER_ERROR", err instanceof Error ? err.message : "Erro inesperado.", 500);
  }
});
