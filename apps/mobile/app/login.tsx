import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../src/components/Button";
import { Screen } from "../src/components/Screen";
import { TextLogo } from "../src/components/TextLogo";
import { ensureProfile } from "../src/services/moneyoung";
import { signInWithGoogle } from "../src/services/auth";
import { isSupabaseConfigured, supabase } from "../src/services/supabase";
import { toast } from "../src/services/toast";
import { colors } from "../src/theme/colors";

function getPendingInvite(): { invite_code: string; org_name: string; code_type: string } | null {
  if (Platform.OS !== "web") return null;
  try {
    const raw = localStorage.getItem("myg_pending_invite");
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

function routeAfterProfile(p: { status?: string; account_type?: string } | null) {
  if (p?.status === "pending") router.replace("/pending-approval");
  else if (p?.account_type === "sub_business") router.replace("/org-home");
  else router.replace("/home");
}

let sessionHandled = false;

async function handleSession() {
  if (sessionHandled) return true;
  sessionHandled = true;

  const invite = getPendingInvite();
  if (invite) {
    router.replace({ pathname: "/register", params: invite });
    return true;
  }

  try {
    await ensureProfile();
    const { data: sess } = await supabase.auth.getSession();
    if (!sess?.session) { sessionHandled = false; return false; }
    const { data: profile } = await supabase
      .from("profiles")
      .select("status,account_type")
      .eq("id", sess.session.user.id)
      .maybeSingle();
    if (profile?.status === "deleted") {
      sessionHandled = false;
      await supabase.auth.signOut();
      toast.error("Cadastro necessario", "Voce precisa de um codigo convite para acessar. Solicite o codigo da sua escola.");
      return false;
    }
    routeAfterProfile(profile);
    return true;
  } catch (err) {
    sessionHandled = false;
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("INVITE_REQUIRED") || msg.includes("codigo convite")) {
      await supabase.auth.signOut();
      toast.error("Cadastro necessario", "Voce precisa de um codigo convite para acessar. Solicite o codigo da sua escola.");
    }
    return false;
  }
}

export default function Login() {
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    sessionHandled = false;

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION")) {
        handleSession();
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) handleSession();
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  async function handleLogin() {
    try {
      setLoading(true);
      const signedIn = await signInWithGoogle();
      if (!signedIn) return;
      await handleSession();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("INVITE_REQUIRED") || msg.includes("codigo convite")) {
        await supabase.auth.signOut();
        toast.error("Cadastro necessario", "Voce precisa de um codigo convite para acessar. Solicite o codigo da sua escola.");
      } else {
        toast.error("Nao foi possivel entrar", msg || "Tente novamente.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll={false} dust>
      <View style={styles.container}>
        <View style={styles.logoArea}>
          <TextLogo size={38} />
          <Text style={styles.tagline}>Empreendedorismo + Educacao Financeira</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.formTitleGroup}>
            <Text style={styles.formTitle}>Bem-vindo(a)!</Text>
            <Text style={styles.formSubtitle}>Faca login para continuar</Text>
          </View>

          <Button title="Entrar" onPress={handleLogin} loading={loading} />

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>ou entre com</Text>
            <View style={styles.divider} />
          </View>
          <View style={styles.socialRow}>
            <Pressable style={styles.socialBtn} onPress={handleLogin}>
              <Ionicons name="logo-google" size={18} color={colors.textPrimary} />
              <Text style={styles.socialText}>Google</Text>
            </Pressable>
          </View>

          <Text style={styles.codeLink} onPress={() => router.push("/invite")}>Ainda nao tem conta? <Text style={styles.codeLinkStrong}>Criar conta</Text></Text>
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    minHeight: 600,
    gap: 28,
  },
  logoArea: {
    alignItems: "center",
    gap: 10,
  },
  tagline: {
    fontSize: 12,
    color: colors.goldLight,
    fontWeight: "800",
  },
  form: {
    gap: 10,
  },
  formTitleGroup: {
    gap: 4,
    marginBottom: 8,
  },
  formTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "900",
  },
  formSubtitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700",
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  divider: { flex: 1, height: 1, backgroundColor: colors.glassBorder },
  dividerText: { color: colors.textSecondary, fontSize: 12 },
  socialRow: { flexDirection: "row", gap: 10 },
  socialBtn: {
    flex: 1,
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: colors.input,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  socialText: { color: colors.textPrimary, fontSize: 13, fontWeight: "800" },
  codeLink: {
    color: colors.textPrimary,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "700",
    marginTop: 22,
  },
  codeLinkStrong: { color: colors.goldLight, fontWeight: "900" },
});
