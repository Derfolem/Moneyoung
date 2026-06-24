import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../src/components/Button";
import { Screen } from "../src/components/Screen";
import { supabase } from "../src/services/supabase";
import { toast } from "../src/services/toast";
import { colors } from "../src/theme/colors";

export default function PendingApproval() {
  const [checking, setChecking] = useState(false);

  async function checkStatus() {
    setChecking(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session?.session) {
        router.replace("/login");
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("status")
        .eq("id", session.session.user.id)
        .maybeSingle();

      if (!profile) {
        toast.info("Aguardando", "Seu cadastro ainda esta em analise.");
        return;
      }
      if (profile.status === "active") {
        toast.success("Aprovado!", "Seu cadastro foi aprovado. Bem-vindo!");
        router.replace("/home");
      } else if (profile.status === "blocked") {
        toast.error("Recusado", "Seu cadastro foi recusado pelo banco.");
      } else {
        toast.info("Aguardando", "Seu cadastro ainda esta em analise.");
      }
    } catch (err) {
      toast.error("Erro", err instanceof Error ? err.message : "Tente novamente.");
    } finally {
      setChecking(false);
    }
  }

  return (
    <Screen scroll={false}>
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Ionicons name="hourglass-outline" size={48} color={colors.gold} />
        </View>

        <Text style={styles.title}>Cadastro Enviado!</Text>
        <Text style={styles.description}>
          Seu cadastro foi enviado para aprovacao do banco Moneyoung.
          Voce recebera acesso assim que for aprovado.
        </Text>

        <Button title={checking ? "Verificando..." : "Verificar Status"} onPress={checkStatus} loading={checking} />

        <Button title="Voltar ao Login" tone="secondary" onPress={() => router.replace("/login")} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    gap: 20,
    alignItems: "center",
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.glass,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.glassBorder,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "900",
    color: colors.textPrimary,
    textAlign: "center",
  },
  description: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 16,
  },
});
