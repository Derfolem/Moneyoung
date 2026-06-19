import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { WalletSummary } from "@moneyoung/shared";
import { PageHeader } from "../src/components/PageHeader";
import { Screen } from "../src/components/Screen";
import { StateView } from "../src/components/StateView";
import { TransactionRow } from "../src/components/TransactionRow";
import { getWalletSummary } from "../src/services/moneyoung";
import { colors } from "../src/theme/colors";

type Filter = "all" | "in" | "out";

const filterLabels: Record<Filter, string> = {
  all: "Tudo",
  in: "Entradas",
  out: "Saidas",
};

export default function Statement() {
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getWalletSummary()
      .then(setSummary)
      .catch((err) => setError(err instanceof Error ? err.message : "Nao foi possivel carregar o extrato."))
      .finally(() => setLoading(false));
  }, []);

  const walletId = summary?.wallet.id;
  const txs = (summary?.recent_transactions ?? []).filter(
    (tx) =>
      filter === "all" ||
      (filter === "in" ? tx.to_wallet_id === walletId : tx.from_wallet_id === walletId)
  );

  if (loading) return <Screen><StateView loading title="Carregando extrato" /></Screen>;
  if (error) return <Screen><PageHeader title="Extrato" /><StateView title="Extrato indisponivel" message={error} /></Screen>;

  return (
    <Screen>
      <PageHeader title="Extrato" />

      <View style={styles.filters}>
        {(["all", "in", "out"] as Filter[]).map((item) => (
          <Pressable
            key={item}
            style={[styles.pill, filter === item && styles.pillActive]}
            onPress={() => setFilter(item)}
          >
            <Text style={[styles.pillText, filter === item && styles.pillTextActive]}>
              {filterLabels[item]}
            </Text>
          </Pressable>
        ))}
      </View>

      {txs.length ? (
        txs.map((tx) => <TransactionRow key={tx.id} tx={tx} walletId={walletId} />)
      ) : (
        <Text style={styles.empty}>Nenhuma transacao para este filtro.</Text>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  filters: { flexDirection: "row", gap: 10 },
  pill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  pillActive: {
    backgroundColor: colors.primary,
  },
  pillText: {
    color: colors.muted,
    fontWeight: "800",
    fontSize: 14,
  },
  pillTextActive: {
    color: "#fff",
  },
  empty: { color: colors.muted, textAlign: "center", paddingVertical: 24 },
});
