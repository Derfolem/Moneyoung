import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { currency, WalletSummary } from "@moneyoung/shared";
import { StateView } from "../src/components/StateView";
import { TransactionRow } from "../src/components/TransactionRow";
import { BottomNav } from "../src/components/BottomNav";
import { GlassCard } from "../src/components/GlassCard";
import { AmbientOrbs, GoldDust } from "../src/components/GoldDust";
import { getWalletSummary } from "../src/services/moneyoung";
import { signOut } from "../src/services/auth";
import { supabase } from "../src/services/supabase";
import { toast } from "../src/services/toast";
import { colors } from "../src/theme/colors";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const quickActions = [
  { icon: "swap-horizontal" as const, label: "Transferir", route: "/transfer" },
  { icon: "download-outline" as const, label: "Receber", route: "/receive" },
];

function newestFirst(txs: WalletSummary["recent_transactions"]) {
  return [...txs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export default function Home() {
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const { data: sess } = await supabase.auth.getSession();
      if (sess?.session) {
        const { data: p } = await supabase
          .from("profiles")
          .select("account_type")
          .eq("id", sess.session.user.id)
          .maybeSingle();
        if (p?.account_type === "sub_business") { router.replace("/org-home"); return; }
      }
      setSummary(await getWalletSummary());
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nao foi possivel carregar sua carteira.";
      if (message.includes("ACCOUNT_DELETED")) {
        await signOut();
        router.replace("/login");
        return;
      }
      setError(message);
      if (message.toLowerCase().includes("unauth")) router.replace("/login");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading && !summary) {
    return (
      <View style={styles.root}>
        <View style={styles.body}><StateView loading title="Carregando carteira" /></View>
        <BottomNav />
      </View>
    );
  }
  if (error && !summary) {
    return (
      <View style={styles.root}>
        <View style={styles.body}>
          <StateView title="Carteira indisponivel" message={error} actionLabel="Tentar novamente" onAction={() => load()} />
        </View>
        <BottomNav />
      </View>
    );
  }

  const name = summary?.profile.display_name ?? "Usuario";
  const youngKey = summary?.profile.young_key ?? "";

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <AmbientOrbs />
      <GoldDust />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.gold} />}
      >
        <View style={styles.header}>
          <View style={styles.identity}>
            <Pressable onPress={() => router.push("/profile")} style={styles.avatar}>
              <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
            </Pressable>
            <View>
              <Text style={styles.greeting}>Ola, {name.split(" ")[0]}!</Text>
              <Text style={styles.role}>Aluno</Text>
            </View>
          </View>
          <Pressable onPress={() => router.push("/notifications")} style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>

        <GlassCard glow style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Saldo disponivel</Text>
            <Pressable onPress={() => router.push("/statement")}>
              <Text style={styles.balanceLink}>Ver extrato</Text>
            </Pressable>
          </View>
          <Text style={styles.balanceValue}>{currency.format(summary?.wallet.balance ?? 0)}</Text>
          <Text style={styles.balanceKey}>{youngKey || getGreeting()}</Text>
        </GlassCard>

        <View style={styles.actionsRow}>
          {quickActions.map((a) => (
            <Pressable key={`${a.label}-${a.route}`} style={styles.actionItem} onPress={() => router.push(a.route)}>
              <View style={styles.actionCircle}>
                <Ionicons name={a.icon} size={22} color={colors.gold} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ultimas transacoes</Text>
          <Pressable onPress={() => router.push("/statement")}>
            <Text style={styles.seeAll}>Ver todas &gt;</Text>
          </Pressable>
        </View>

        {summary?.recent_transactions.length ? (
          <View style={styles.txList}>
            {newestFirst(summary.recent_transactions).slice(0, 5).map((tx) => (
              <TransactionRow key={tx.id} tx={tx} walletId={summary.wallet.id} />
            ))}
          </View>
        ) : (
          <Text style={styles.empty}>Nenhuma transacao registrada ainda.</Text>
        )}
      </ScrollView>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navyDeep },
  body: { flex: 1, justifyContent: "center", padding: 24 },
  scroll: { flex: 1 },
  scrollContent: {
    width: "100%",
    maxWidth: 430,
    alignSelf: "center",
    padding: 20,
    paddingBottom: 16,
    gap: 18,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
  },
  identity: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  notificationDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 1,
    borderColor: colors.navyDeep,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: colors.goldLight,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  avatarText: { color: colors.navyDeep, fontWeight: "900", fontSize: 15 },

  greeting: { fontSize: 15, color: colors.textPrimary, fontWeight: "900" },
  role: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },

  balanceCard: {
    gap: 8,
    minHeight: 110,
    justifyContent: "center",
    backgroundColor: "rgba(31,32,27,0.74)",
  },
  balanceHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  balanceLabel: { color: colors.textPrimary, fontSize: 13 },
  balanceLink: { color: colors.goldLight, fontSize: 12, fontWeight: "800" },
  balanceValue: {
    color: colors.textPrimary,
    fontSize: 34,
    fontWeight: "900",
    marginVertical: 2,
    textShadowColor: colors.glowGold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  balanceKey: { color: colors.textSecondary, fontSize: 12, fontWeight: "600" },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionItem: { alignItems: "center", gap: 7, flex: 1 },
  actionCircle: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.input,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
  },
  actionLabel: { fontSize: 11, color: colors.textPrimary, fontWeight: "700" },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 16, fontWeight: "900", color: colors.textPrimary },
  seeAll: { color: colors.goldLight, fontWeight: "800", fontSize: 12 },
  txList: {
    gap: 0,
    backgroundColor: colors.glass,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: "hidden",
  },
  empty: { color: colors.textSecondary, textAlign: "center", paddingVertical: 18 },
});
