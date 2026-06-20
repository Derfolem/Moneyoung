import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "../src/components/Button";
import { PageHeader } from "../src/components/PageHeader";
import { Screen } from "../src/components/Screen";
import { getWalletSummary, parseAmount, transferMoneyoung } from "../src/services/moneyoung";
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
      const summary = await getWalletSummary();
      await transferMoneyoung({
        to_young_key: to ?? "",
        amount: parseAmount(amount ?? "0"),
        description,
      });
      router.replace({
        pathname: "/receipt",
        params: {
          to,
          amount,
          description,
          date: new Date().toISOString(),
          from: summary.profile.young_key,
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
      <PageHeader title="Confirmar" backTo="/transfer" />

      <View style={styles.card}>
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

      <Button title="Confirmar transferencia" onPress={confirm} loading={loading} />
      <Button title="Cancelar" onPress={() => router.back()} tone="ghost" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 24,
    gap: 16,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 3,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
  },
  amount: {
    fontSize: 40,
    fontWeight: "900",
    color: colors.ink,
  },
  suffix: {
    fontSize: 20,
    fontWeight: "700",
    color: colors.muted,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
  },
  detail: {
    gap: 4,
  },
  label: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: "600",
  },
  value: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.ink,
  },
});
