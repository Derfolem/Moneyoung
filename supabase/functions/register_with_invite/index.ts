import { error, json, corsHeaders, parseBody } from "../_shared/http.ts";
import { requireUser, requestMeta } from "../_shared/supabase.ts";

type Body = {
  invite_code?: string;
  full_name?: string;
  birth_date?: string;
  country?: string;
  state?: string;
  city?: string;
  sport?: string;
  about?: string;
  hobby?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return error("METHOD_NOT_ALLOWED", "Use POST.", 405);
  try {
    const { user, serviceClient } = await requireUser(req);
    const body = await parseBody<Body>(req);

    if (!body.invite_code) return error("INVALID_INPUT", "Informe o codigo convite.", 422);
    if (!body.full_name || body.full_name.trim().length < 2) return error("INVALID_INPUT", "Informe o nome completo.", 422);
    if (!body.birth_date) return error("INVALID_INPUT", "Informe a data de nascimento.", 422);

    const meta = requestMeta(req);
    const { data, error: rpcError } = await serviceClient.rpc("register_with_invite", {
      p_user_id: user.id,
      p_email: user.email ?? "",
      p_full_name: body.full_name,
      p_birth_date: body.birth_date,
      p_country: body.country ?? null,
      p_state: body.state ?? null,
      p_city: body.city ?? null,
      p_sport: body.sport ?? null,
      p_about: body.about ?? null,
      p_hobby: body.hobby ?? null,
      p_invite_code: body.invite_code,
      p_ip_address: meta.ip_address,
      p_user_agent: meta.user_agent
    });

    if (rpcError) {
      const msg = rpcError.message ?? "";
      if (msg.includes("PROFILE_ALREADY_EXISTS")) return error("PROFILE_EXISTS", "Perfil ja existe para este usuario.", 409);
      if (msg.includes("INVALID_INVITE_CODE")) return error("INVALID_INVITE_CODE", "Codigo convite invalido ou escola inativa.", 422);
      return error("INVALID_INPUT", msg, 422);
    }

    const row = Array.isArray(data) ? data[0] : data;
    return json({ profile: row?.profile ?? null, wallet: row?.wallet ?? null }, 201);
  } catch (err) {
    if (err instanceof Response) return err;
    return error("SERVER_ERROR", err instanceof Error ? err.message : "Erro inesperado.", 500);
  }
});
