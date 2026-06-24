import { error, json, corsHeaders } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const { user, serviceClient } = await requireUser(req);
    const email = user.email;
    if (!email) return error("INVALID_INPUT", "Conta OAuth sem e-mail confirmado.", 422);

    const { data, error: rpcError } = await serviceClient.rpc("create_profile_and_wallet", {
      p_user_id: user.id,
      p_email: email,
      p_display_name: user.user_metadata?.full_name ?? user.user_metadata?.name ?? null,
      p_avatar_url: user.user_metadata?.avatar_url ?? null
    });

    if (rpcError) {
      const msg = rpcError.message ?? "";
      if (msg.includes("INVITE_REQUIRED")) {
        return error("INVITE_REQUIRED", "Cadastro requer codigo convite. Solicite o codigo da sua escola.", 403);
      }
      return error("SERVER_ERROR", msg, 500);
    }
    return json({ data });
  } catch (err) {
    if (err instanceof Response) return err;
    return error("SERVER_ERROR", err instanceof Error ? err.message : "Erro inesperado.", 500);
  }
});
