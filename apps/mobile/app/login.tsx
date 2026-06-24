import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, TextInput, View } from "react-native";
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
          <TextLogo size={40} />
          <View style={styles.goldLine} />
          <Text style={styles.tagline}>Sua carteira digital educacional</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            editable={false}
          />
          <Button title="Entrar" onPress={handleLogin} loading={loading} />

          <Text style={styles.codeLink} onPress={() => router.push("/invite")}>Codigo Convite</Text>
        </View>

        <Text style={styles.footer}>
          Sua carteira MoneYoung para aprender, enviar, receber e pagar com seguranca.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    minHeight: 600,
    gap: 40,
  },
  logoArea: {
    alignItems: "center",
    gap: 12,
  },
  goldLine: {
    width: 60,
    height: 2,
    backgroundColor: colors.gold,
    borderRadius: 1,
    marginTop: 4,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
  },
  tagline: {
    fontSize: 14,
    color: colors.gold,
    fontWeight: "600",
    marginTop: 4,
  },
  form: {
    gap: 14,
  },
  input: {
    backgroundColor: colors.glass,
    borderRadius: 16,
    minHeight: 52,
    paddingHorizontal: 18,
    color: colors.textPrimary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    // @ts-ignore
    backdropFilter: "blur(12px)",
    // @ts-ignore
    WebkitBackdropFilter: "blur(12px)",
  },
  codeLink: {
    color: colors.gold,
    textAlign: "center",
    fontSize: 14,
    fontWeight: "700",
    marginTop: 4,
  },
  footer: {
    color: colors.textSecondary,
    textAlign: "center",
    fontSize: 13,
    lineHeight: 20,
  },
});
