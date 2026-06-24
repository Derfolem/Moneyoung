import { error, json, corsHeaders, parseBody } from "../_shared/http.ts";
import { clients } from "../_shared/supabase.ts";

type Body = { code?: string };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return error("METHOD_NOT_ALLOWED", "Use POST.", 405);
  try {
    const { serviceClient } = clients(req);
    const body = await parseBody<Body>(req);
    if (!body.code || body.code.trim().length < 7) {
      return error("INVALID_INPUT", "Informe um codigo convite valido.", 422);
    }

    const { data, error: rpcError } = await serviceClient.rpc("validate_invite_code", {
      p_code: body.code.trim()
    });
    if (rpcError) return error("INVALID_INPUT", rpcError.message, 422);

    const row = Array.isArray(data) ? data[0] : data;
    if (!row?.valid) {
      return json({ valid: false, organization_name: null, code_type: null });
    }
    return json({
      valid: true,
      organization_id: row.organization_id,
      organization_name: row.organization_name,
      code_type: row.code_type
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return error("SERVER_ERROR", err instanceof Error ? err.message : "Erro inesperado.", 500);
  }
});
