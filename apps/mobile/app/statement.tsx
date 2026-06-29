import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { currency, LedgerTransaction } from "@moneyoung/shared";
import { GlassCard } from "../src/components/GlassCard";
import { PageHeader } from "../src/components/PageHeader";
import { Screen } from "../src/components/Screen";
import { StateView } from "../src/components/StateView";
import { TransactionRow } from "../src/components/TransactionRow";
import { BottomNav } from "../src/components/BottomNav";
import { getWalletSummary, getOrgWalletSummary } from "../src/services/moneyoung";
import { supabase } from "../src/services/supabase";
import { colors } from "../src/theme/colors";

type Filter = "all" | "in" | "out";
const filterLabels: Record<Filter, string> = { all: "Tudo", in: "Entradas", out: "Saidas" };

function newestFirst(txs: LedgerTransaction[]) {
  return [...txs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export default function Statement() {
  const [walletId, setWalletId] = useState("");
  const [balance, setBalance] = useState("0");
  const [txs, setTxs] = useState<LedgerTransaction[]>([]);
  const [isStaff, setIsStaff] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError("");
    try {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess?.session?.user.id;
      if (!uid) return;
      const { data: prof } = await supabase
        .from("profiles").select("account_type").eq("id", uid).maybeSingle();

      if (prof?.account_type === "sub_business") {
        setIsStaff(true);
        const org = await getOrgWalletSummary();
        setWalletId(org.wallet.id);
        setBalance(org.wallet.balance);
        setTxs(newestFirst(org.recent_transactions ?? []));
      } else {
        const s = await getWalletSummary();
        setWalletId(s.wallet.id);
        setBalance(s.wallet.balance);
        setTxs(newestFirst(s.recent_transactions ?? []));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar o extrato.");
    } finally {
      setLoading(false);
    }
  }

  const filtered = newestFirst(txs.filter(
    (tx) =>
      filter === "all" ||
      (filter === "in" ? tx.to_wallet_id === walletId : tx.from_wallet_id === walletId)
  ));

  if (loading) {
    return (
      <View style={styles.rootWrap}>
        <Screen><StateView loading title="Carregando extrato" /></Screen>
        <BottomNav staff={isStaff} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.rootWrap}>
        <Screen>
          <PageHeader title="Extrato" />
          <StateView title="Extrato indisponivel" message={error} actionLabel="Tentar novamente" onAction={load} />
        </Screen>
        <BottomNav staff={isStaff} />
      </View>
    );
  }

  return (
    <View style={styles.rootWrap}>
      <Screen>
        <PageHeader title="Extrato" />
        <GlassCard glow style={styles.balanceSummary}>
          <Text style={styles.balanceLabel}>Saldo atual</Text>
          <Text style={styles.balanceValue}>{currency.format(balance)}</Text>
        </GlassCard>

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

        <View style={styles.txList}>
          {filtered.length ? (
            filtered.map((tx) => <TransactionRow key={tx.id} tx={tx} walletId={walletId} />)
          ) : (
            <Text style={styles.empty}>Nenhuma transacao para este filtro.</Text>
          )}
        </View>
      </Screen>
      <BottomNav staff={isStaff} />
    </View>
  );
}

const styles = StyleSheet.create({
  rootWrap: { flex: 1, backgroundColor: colors.navyDeep },
  balanceSummary: { paddingVertical: 16, gap: 4, backgroundColor: "rgba(31,32,27,0.74)" },
  balanceLabel: { color: colors.textPrimary, fontSize: 13 },
  balanceValue: {
    color: colors.textPrimary, fontSize: 30, fontWeight: "900",
    textShadowColor: colors.glowGold, textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  filters: { flexDirection: "row", gap: 10 },
  pill: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10,
    backgroundColor: colors.input, borderWidth: 1, borderColor: colors.glassBorder,
    // @ts-ignore
    backdropFilter: "blur(12px)",
    // @ts-ignore
    WebkitBackdropFilter: "blur(12px)",
  },
  pillActive: {
    backgroundColor: colors.gold, borderColor: colors.gold,
    shadowColor: colors.gold, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3, shadowRadius: 10,
  },
  pillText: { color: colors.textSecondary, fontWeight: "800", fontSize: 14 },
  pillTextActive: { color: colors.textPrimary },
  txList: {
    gap: 0,
    backgroundColor: colors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: "hidden",
  },
  empty: { color: colors.textSecondary, textAlign: "center", paddingVertical: 24 },
});
