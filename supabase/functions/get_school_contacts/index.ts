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

    if (!membership) return json({ contacts: [], recent_contacts: [], account_type: profile.account_type });

    const orgId = membership.organization_id;

    // Aluno vê colaboradores; colaborador vê alunos
    const targetRoles = profile.account_type === "personal"
      ? ["teacher", "staff", "admin"]
      : ["student"];

    const { data: members } = await serviceClient
      .from("organization_members")
      .select("member_role, profiles(id, display_name, young_key)")
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

    // Busca os últimos 5 destinatários únicos que são membros desta escola
    let recentContacts: any[] = [];
    try {
      let senderWalletId: string | null = null;

      if (profile.account_type === "personal") {
        const { data: w } = await serviceClient
          .from("wallets")
          .select("id")
          .eq("profile_id", user.id)
          .eq("status", "active")
          .maybeSingle();
        senderWalletId = w?.id ?? null;
      } else {
        const { data: w } = await serviceClient
          .from("wallets")
          .select("id")
          .eq("organization_id", orgId)
          .eq("wallet_type", "business")
          .eq("status", "active")
          .maybeSingle();
        senderWalletId = w?.id ?? null;
      }

      if (senderWalletId) {
        const { data: txs } = await serviceClient
          .from("transactions")
          .select("to_wallet_id")
          .eq("from_wallet_id", senderWalletId)
          .eq("status", "completed")
          .order("created_at", { ascending: false })
          .limit(30);

        // IDs únicos preservando ordem cronológica (mais recente primeiro)
        const seen = new Set<string>();
        const toWalletIds: string[] = [];
        for (const t of txs ?? []) {
          if (t.to_wallet_id && !seen.has(t.to_wallet_id)) {
            seen.add(t.to_wallet_id);
            toWalletIds.push(t.to_wallet_id);
          }
        }

        if (toWalletIds.length > 0) {
          const { data: wallets } = await serviceClient
            .from("wallets")
            .select("id, profile_id")
            .in("id", toWalletIds);

          const walletToProfile = new Map((wallets ?? []).map((w: any) => [w.id, w.profile_id]));
          const contactMap = new Map(contacts.map((c: any) => [c.profile_id, c]));

          for (const wId of toWalletIds) {
            const profileId = walletToProfile.get(wId);
            if (profileId && contactMap.has(profileId)) {
              recentContacts.push(contactMap.get(profileId));
              if (recentContacts.length >= 5) break;
            }
          }
        }
      }
    } catch (_) {
      // recent_contacts é não-crítico, falha silenciosa
    }

    return json({ contacts, recent_contacts: recentContacts, account_type: profile.account_type });
  } catch (err) {
    if (err instanceof Response) return err;
    return error("SERVER_ERROR", err instanceof Error ? err.message : "Erro inesperado.", 500);
  }
});
