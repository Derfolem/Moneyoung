import { error, json, corsHeaders, parseBody } from "../_shared/http.ts";
import { requireUser, requestMeta } from "../_shared/supabase.ts";

type Body = { reason?: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return error("METHOD_NOT_ALLOWED", "Use POST.", 405);
  try {
    const { user, serviceClient } = await requireUser(req);
    const body = await parseBody<Body>(req);

    const { data, error: rpcError } = await serviceClient.rpc("request_account_cancellation", {
      p_user_id: user.id,
      p_reason: body.reason ?? null,
    });
    if (rpcError) return error("INVALID_INPUT", rpcError.message, 422);

    return json({ profile: data });
  } catch (err) {
    if (err instanceof Response) return err;
    return error("SERVER_ERROR", err instanceof Error ? err.message : "Erro inesperado.", 500);
  }
});
