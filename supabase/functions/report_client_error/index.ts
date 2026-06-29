import { corsHeaders, error, json, parseBody } from "../_shared/http.ts";
import { clients } from "../_shared/supabase.ts";

type Body = {
  profile_id?: string;
  screen?: string;
  action?: string;
  error_code?: string;
  error_message?: string;
  platform?: string;
  app_version?: string;
  metadata?: Record<string, unknown>;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return error("METHOD_NOT_ALLOWED", "Use POST.", 405);

  try {
    const body = await parseBody<Body>(req);
    const message = (body.error_message ?? "").trim();
    if (!message) return new Response(null, { status: 204, headers: corsHeaders });

    const { serviceClient } = clients(req);
    await serviceClient.from("client_error_reports").insert({
      profile_id:    body.profile_id    ?? null,
      screen:        body.screen        ?? null,
      action:        body.action        ?? null,
      error_code:    body.error_code    ?? null,
      error_message: message,
      platform:      body.platform      ?? "mobile",
      app_version:   body.app_version   ?? null,
      metadata:      body.metadata      ?? {},
    });
  } catch {
    // Falha silenciosa — não propaga erro para o cliente
  }

  return new Response(null, { status: 204, headers: corsHeaders });
});
