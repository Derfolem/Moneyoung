import { router, useLocalSearchParams } from "expo-router";
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

export default function AuthCallback() {
  const params = useLocalSearchParams<{ code?: string; error_description?: string }>();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    async function handle() {
      if (params.error_description) {
        setErrorMsg(params.error_description);
        return;
      }
      try {
        const { data: existing } = await supabase.auth.getSession();
        if (!existing.session && params.code) {
          const { error } = await supabase.auth.exchangeCodeForSession(params.code);
          if (error) throw error;
        }
        await ensureProfile();
        const { data: sess } = await supabase.auth.getSession();
        if (!sess.session) { router.replace("/login"); return; }
        const { data: profile } = await supabase
          .from("profiles")
          .select("status,account_type")
          .eq("id", sess.session.user.id)
          .maybeSingle();
        routeAfterProfile(profile);
      } catch (err) {
        setErrorMsg(err instanceof Error ? err.message : "Erro ao concluir login.");
      }
    }

    handle();
  }, [params.code, params.error_description]);

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
