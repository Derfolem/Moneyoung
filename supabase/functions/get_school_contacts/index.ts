import { error, json, corsHeaders } from "../_shared/http.ts";
import { requireUser, assertActiveProfile } from "../_shared/supabase.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return error("METHOD_NOT_ALLOWED", "Use POST.", 405);
  try {
    const { user, serviceClient } = await requireUser(req);
    await assertActiveProfile(serviceClient, user.id);

    const { data: profile } = await serviceClient
      .from("profiles")
      .select("account_type")
      .eq("id", user.id)
      .single();

    if (!profile) return error("NOT_FOUND", "Perfil nao encontrado.", 404);

    const { data: membership } = await serviceClient
      .from("organization_members")
      .select("organization_id")
      .eq("profile_id", user.id)
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (!membership) return json({ contacts: [], account_type: profile.account_type });

    const orgId = membership.organization_id;

    // Aluno vê colaboradores; colaborador vê alunos
    const targetRoles = profile.account_type === "personal"
      ? ["teacher", "staff", "admin"]
      : ["student"];

    const { data: members } = await serviceClient
      .from("organization_members")
      .select("member_role, profiles(id, display_name, young_key, account_type, status)")
      .eq("organization_id", orgId)
      .eq("status", "active")
      .in("member_role", targetRoles);

    const contacts = (members ?? [])
      .map((m: any) => ({
        profile_id: m.profiles?.id,
        display_name: m.profiles?.display_name ?? "",
        young_key: m.profiles?.young_key ?? "",
        member_role: m.member_role,
      }))
      .filter((c: any) => c.young_key && c.profile_id !== user.id)
      .sort((a: any, b: any) => a.display_name.localeCompare(b.display_name));

    return json({ contacts, account_type: profile.account_type });
  } catch (err) {
    if (err instanceof Response) return err;
    return error("SERVER_ERROR", err instanceof Error ? err.message : "Erro inesperado.", 500);
  }
});
