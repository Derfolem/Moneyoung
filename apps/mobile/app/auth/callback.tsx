import { router, useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Screen } from "../../src/components/Screen";
import { ensureProfile } from "../../src/services/moneyoung";
import { supabase } from "../../src/services/supabase";
import { colors } from "../../src/theme/colors";

function routeAfterProfile(p: { status?: string; account_type?: string } | null) {
  if (p?.status === "pending") router.replace("/pending-approval");
  else if (p?.account_type === "sub_business") router.replace("/org-home");
  else router.replace("/home");
}

type FragmentTokens = { access_token: string; refresh_token: string };

function parseAuthFromUrl(raw: string | null | undefined): { code: string | null; tokens: FragmentTokens | null } {
  if (!raw) return { code: null, tokens: null };
  try {
    const url = new URL(raw);
    const code = url.searchParams.get("code");
    const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
    const h = new URLSearchParams(hash);
    const access_token = h.get("access_token");
    const refresh_token = h.get("refresh_token");
    return { code, tokens: access_token && refresh_token ? { access_token, refresh_token } : null };
  } catch {
    return { code: null, tokens: null };
  }
}

export default function AuthCallback() {
  const params = useLocalSearchParams<{ code?: string; error_description?: string }>();
  const rawUrl = Linking.useURL();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;

    async function finishLogin() {
      // sessao estabelecida: garante perfil e roteia
      await ensureProfile();
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) { router.replace("/login"); return; }
      const { data: profile } = await supabase
        .from("profiles")
        .select("status,account_type")
        .eq("id", sess.session.user.id)
        .maybeSingle();
      routeAfterProfile(profile);
    }

    async function handle(code: string | null, tokens: FragmentTokens | null) {
      if (params.error_description) {
        setErrorMsg(params.error_description);
        return;
      }
      try {
        const { data: existing } = await supabase.auth.getSession();
        if (!existing.session) {
          if (code) {
            const { error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              // signInWithGoogle pode ter trocado o mesmo codigo primeiro
              const { data: retry } = await supabase.auth.getSession();
              if (!retry.session) throw error;
            }
          } else if (tokens) {
            const { error } = await supabase.auth.setSession(tokens);
            if (error) throw error;
          } else {
            router.replace("/login");
            return;
          }
        }
        await finishLogin();
      } catch (err) {
        // se apesar do erro uma sessao existe (corrida entre rotas), segue o fluxo
        const { data: sess } = await supabase.auth.getSession();
        if (sess.session) {
          try { await finishLogin(); return; } catch { /* cai no erro abaixo */ }
        }
        setErrorMsg(err instanceof Error ? err.message : "Erro ao concluir login.");
      }
    }

    const fromUrl = parseAuthFromUrl(rawUrl);
    const code = params.code ?? fromUrl.code;
    const tokens = fromUrl.tokens;

    if (code || tokens || params.error_description) {
      ran.current = true;
      handle(code, tokens);
      return;
    }

    // sem code/tokens ainda (rawUrl pode chegar depois): aguarda um pouco;
    // se nada chegar, verifica sessao existente ou volta ao login
    const t = setTimeout(async () => {
      if (ran.current) return;
      ran.current = true;
      const { data } = await supabase.auth.getSession();
      if (data.session) handle(null, null);
      else router.replace("/login");
    }, 4000);
    return () => clearTimeout(t);
  }, [params.code, params.error_description, rawUrl]);

  return (
    <Screen>
      <View style={styles.container}>
        {errorMsg ? (
          <>
            <Text style={styles.errorTitle}>Nao foi possivel entrar</Text>
            <Text style={styles.errorText}>{errorMsg}</Text>
            <Text style={styles.link} onPress={() => router.replace("/login")}>Voltar ao login</Text>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color={colors.gold} />
            <Text style={styles.text}>Concluindo login...</Text>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", gap: 16, padding: 24 },
  text: { color: colors.textSecondary, fontSize: 14 },
  errorTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "900" },
  errorText: { color: colors.textSecondary, fontSize: 14, textAlign: "center" },
  link: { color: colors.goldLight, fontWeight: "800", marginTop: 8 },
});
