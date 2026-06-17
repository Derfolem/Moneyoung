import { error, json, corsHeaders, parseBody } from "../_shared/http.ts";
import { assertBankAdmin, requireUser, requestMeta } from "../_shared/supabase.ts";

type Body = { name?: string; slug?: string; owner_profile_id?: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return error("METHOD_NOT_ALLOWED", "Use POST para criar organizacoes.", 405);
  try {
    const { user, serviceClient } = await requireUser(req);
    await assertBankAdmin(serviceClient, user.id);
    const body = await parseBody<Body>(req);
    if (!body.name || !body.slug) return error("INVALID_INPUT", "Informe nome e slug da organizacao.", 422);

    const meta = requestMeta(req);
    const { data, error: rpcError } = await serviceClient.rpc("create_organization_account_tx", {
      p_actor_id: user.id,
      p_name: body.name,
      p_slug: body.slug,
      p_owner_profile_id: body.owner_profile_id ?? null,
      p_ip_address: meta.ip_address,
      p_user_agent: meta.user_agent
    });
    if (rpcError) return error("INVALID_INPUT", rpcError.message, 422);

    const row = Array.isArray(data) ? data[0] : data;
    return json({ organization: row?.organization ?? null, business_wallet: row?.business_wallet ?? null });
  } catch (err) {
    if (err instanceof Response) return err;
    return error("SERVER_ERROR", err instanceof Error ? err.message : "Erro inesperado.", 500);
  }
});
