import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { Button } from "../src/components/Button";
import { Screen } from "../src/components/Screen";
import { HexLogo } from "../src/components/HexLogo";
import { ensureProfile } from "../src/services/moneyoung";
import { signInWithGoogle } from "../src/services/auth";
import { isSupabaseConfigured } from "../src/services/supabase";
import { colors } from "../src/theme/colors";

export default function Login() {
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    try {
      setLoading(true);
      const signedIn = await signInWithGoogle();
      if (!signedIn) return;
      await ensureProfile();
      router.replace("/home");
    } catch (err) {
      Alert.alert("Nao foi possivel entrar", err instanceof Error ? err.message : "Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen darkMode scroll={false}>
      <View style={styles.container}>
        <View style={styles.logoArea}>
          <HexLogo size={120} color={colors.primary} />
          <Text style={styles.brand}>Moneyoung (MYG)</Text>
          <Text style={styles.tagline}>A MOEDA DA EDUCACAO</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            placeholderTextColor="rgba(255,255,255,0.4)"
            keyboardType="email-address"
            autoCapitalize="none"
            value={isSupabaseConfigured ? "" : "demo@moneyoung.local"}
            editable={false}
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            placeholderTextColor="rgba(255,255,255,0.4)"
            secureTextEntry
            value={isSupabaseConfigured ? "" : "••••••••"}
            editable={false}
          />
          <Button title="Entrar" onPress={handleLogin} loading={loading} />
        </View>

        <Text style={styles.footer}>
          Sua carteira Moneyoung para aprender, enviar, receber e pagar com seguranca.
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
  brand: {
    fontSize: 32,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: 2,
    marginTop: 8,
  },
  tagline: {
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    letterSpacing: 4,
    fontWeight: "600",
  },
  form: {
    gap: 14,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    minHeight: 52,
    paddingHorizontal: 18,
    color: "#fff",
    fontSize: 16,
  },
  footer: {
    color: "rgba(255,255,255,0.35)",
    textAlign: "center",
    fontSize: 13,
    lineHeight: 20,
  },
});
