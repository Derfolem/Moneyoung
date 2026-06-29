import { error, json, corsHeaders, parseBody } from "../_shared/http.ts";
import { assertBankAdmin, requireUser, requestMeta } from "../_shared/supabase.ts";

type Body = { type: "organization" | "profile"; id: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return error("METHOD_NOT_ALLOWED", "Use POST.", 405);
  try {
    const { user, serviceClient } = await requireUser(req);
    await assertBankAdmin(serviceClient, user.id);
    const body = await parseBody<Body>(req);
    if (!body.type || !body.id) return error("INVALID_INPUT", "Informe type e id.", 422);
    if (!["organization", "profile"].includes(body.type)) {
      return error("INVALID_INPUT", "type deve ser 'organization' ou 'profile'.", 422);
    }
    const meta = requestMeta(req);
    if (body.type === "organization") {
      const { data, error: rpcError } = await serviceClient.rpc("hard_purge_organization", {
        p_org_id: body.id,
        p_actor_id: user.id,
        p_ip_address: meta.ip_address,
        p_user_agent: meta.user_agent,
      });
      if (rpcError) return error("INVALID_INPUT", rpcError.message, 422);
      return json(data);
    } else {
      const { data, error: rpcError } = await serviceClient.rpc("hard_purge_profile", {
        p_profile_id: body.id,
        p_actor_id: user.id,
        p_ip_address: meta.ip_address,
        p_user_agent: meta.user_agent,
      });
      if (rpcError) return error("INVALID_INPUT", rpcError.message, 422);
      return json(data);
    }
  } catch (err) {
    if (err instanceof Response) return err;
    return error("SERVER_ERROR", err instanceof Error ? err.message : "Erro inesperado.", 500);
  }
});
