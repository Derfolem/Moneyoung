import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

export function clients(req: Request) {
  const url = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!url || !anonKey || !serviceKey) {
    throw new Error("Missing Supabase environment variables");
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const userClient = createClient(url, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false }
  });

  const serviceClient = createClient(url, serviceKey, {
    auth: { persistSession: false }
  });

  return { userClient, serviceClient };
}

export async function requireUser(req: Request) {
  const { userClient, serviceClient } = clients(req);
  const { data, error } = await userClient.auth.getUser();
  if (error || !data.user) {
    throw new Response(JSON.stringify({ error: { code: "UNAUTHENTICATED", message: "Sessao invalida ou expirada." } }), {
      status: 401,
      headers: { "Content-Type": "application/json" }
    });
  }
  return { user: data.user, userClient, serviceClient };
}

export function requestMeta(req: Request) {
  return {
    ip_address: req.headers.get("x-forwarded-for") ?? null,
    user_agent: req.headers.get("user-agent") ?? null
  };
}

export async function assertBankAdmin(serviceClient: ReturnType<typeof createClient>, profileId: string) {
  const { data, error } = await serviceClient
    .from("profiles")
    .select("role,status")
    .eq("id", profileId)
    .single();

  if (error || !data || data.status !== "active" || !["bank_admin", "super_admin"].includes(data.role)) {
    throw new Response(JSON.stringify({ error: { code: "FORBIDDEN", message: "Acesso restrito ao banco YoungCoin." } }), {
      status: 403,
      headers: { "Content-Type": "application/json" }
    });
  }
}
