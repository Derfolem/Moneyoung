import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "../src/components/Button";
import { PageHeader } from "../src/components/PageHeader";
import { Screen } from "../src/components/Screen";
import { TextLogo } from "../src/components/TextLogo";
import { getWalletSummary, getOrgWalletSummary, parseAmount, transferMoneyoung, transferFromOrg } from "../src/services/moneyoung";
import { supabase } from "../src/services/supabase";
import { toast } from "../src/services/toast";
import { colors } from "../src/theme/colors";

export default function TransferConfirm() {
  const { to, amount, description } = useLocalSearchParams<{
    to: string;
    amount: string;
    description: string;
  }>();
  const [loading, setLoading] = useState(false);

  async function confirm() {
    try {
      setLoading(true);

      const { data: session } = await supabase.auth.getSession();
      const uid = session?.session?.user.id;
      let fromKey = "";
      let isStaff = false;

      if (uid) {
        const { data: prof } = await supabase
          .from("profiles")
          .select("account_type,young_key")
          .eq("id", uid)
          .maybeSingle();
        fromKey = prof?.young_key ?? "";
        isStaff = prof?.account_type === "sub_business";
      }

      if (isStaff) {
        await transferFromOrg({
          to_young_key: to ?? "",
          amount: parseAmount(amount ?? "0"),
          description,
        });
      } else {
        await transferMoneyoung({
          to_young_key: to ?? "",
          amount: parseAmount(amount ?? "0"),
          description,
        });
      }

      router.replace({
        pathname: "/receipt",
        params: {
          to,
          amount,
          description,
          date: new Date().toISOString(),
          from: fromKey,
        },
      });
    } catch (err) {
      toast.error("Erro ao transferir", err instanceof Error ? err.message : "Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <PageHeader title="Confirmar transferencia" backTo="/transfer" />

      <View style={styles.card}>
        <TextLogo size={18} color={colors.textSecondary} />
        <View style={styles.amountRow}>
          <Text style={styles.amount}>{amount}</Text>
          <Text style={styles.suffix}>YC</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.detail}>
          <Text style={styles.label}>Destinatario</Text>
          <Text style={styles.value}>{to}</Text>
        </View>

        <View style={styles.detail}>
          <Text style={styles.label}>Descricao</Text>
          <Text style={styles.value}>{description || "Sem descricao"}</Text>
        </View>
      </View>

      <Button title="Confirmar" onPress={confirm} loading={loading} />
      <Button title="Cancelar" onPress={() => router.back()} tone="ghost" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.glass,
    borderRadius: 20,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
    // @ts-ignore
    backdropFilter: "blur(16px)",
    // @ts-ignore
    WebkitBackdropFilter: "blur(16px)",
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 4,
  },
  amount: {
    fontSize: 40,
    fontWeight: "900",
    color: colors.gold,
    textShadowColor: colors.glowGold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  suffix: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  divider: {
    height: 1,
    backgroundColor: colors.glassBorder,
    alignSelf: "stretch",
  },
  detail: {
    gap: 4,
    alignSelf: "stretch",
  },
  label: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  value: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
});
