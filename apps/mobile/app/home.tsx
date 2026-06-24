import { router } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { currency, WalletSummary } from "@moneyoung/shared";
import { StateView } from "../src/components/StateView";
import { TransactionRow } from "../src/components/TransactionRow";
import { TextLogo } from "../src/components/TextLogo";
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
  { icon: "card-outline" as const, label: "Pagar", route: "/pay" },
  { icon: "download-outline" as const, label: "Receber", route: "/receive" },
  { icon: "document-text-outline" as const, label: "Extrato", route: "/statement" },
];

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
          <TextLogo size={24} />
          <View style={styles.headerRight}>
            <Pressable onPress={() => router.push("/notifications")} style={styles.iconBtn}>
              <Ionicons name="notifications-outline" size={22} color={colors.gold} />
            </Pressable>
            <Pressable onPress={() => router.push("/profile")} style={styles.avatar}>
              <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.greeting}>{getGreeting()}, <Text style={styles.greetingName}>{name}</Text></Text>

        <GlassCard glow style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo disponivel</Text>
          <Text style={styles.balanceValue}>{currency.format(summary?.wallet.balance ?? 0)}</Text>
          <Text style={styles.balanceKey}>{youngKey}</Text>

          <View style={styles.tabRow}>
            <Pressable style={styles.tab} onPress={() => router.push("/transfer")}>
              <Ionicons name="arrow-up-outline" size={18} color={colors.gold} />
              <Text style={styles.tabText}>Enviar</Text>
            </Pressable>
            <View style={styles.tabDivider} />
            <Pressable style={styles.tab} onPress={() => router.push("/receive")}>
              <Ionicons name="arrow-down-outline" size={18} color={colors.gold} />
              <Text style={styles.tabText}>Receber</Text>
            </Pressable>
          </View>
        </GlassCard>

        <View style={styles.actionsRow}>
          {quickActions.map((a) => (
            <Pressable key={a.route} style={styles.actionItem} onPress={() => router.push(a.route)}>
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
            <Text style={styles.seeAll}>Ver tudo</Text>
          </Pressable>
        </View>

        {summary?.recent_transactions.length ? (
          <View style={styles.txList}>
            {summary.recent_transactions.slice(0, 5).map((tx) => (
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
  scrollContent: { padding: 20, paddingBottom: 16, gap: 18 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
  },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.glass,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.gold,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  avatarText: { color: colors.navyDeep, fontWeight: "900", fontSize: 15 },

  greeting: { fontSize: 16, color: colors.textSecondary },
  greetingName: { color: colors.textPrimary, fontWeight: "800" },

  balanceCard: {
    gap: 6,
  },
  balanceLabel: { color: colors.textSecondary, fontSize: 13 },
  balanceValue: {
    color: colors.gold,
    fontSize: 34,
    fontWeight: "900",
    marginVertical: 2,
    textShadowColor: colors.glowGold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  balanceKey: { color: colors.textSecondary, fontSize: 13, fontWeight: "600" },
  tabRow: {
    flexDirection: "row",
    marginTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    paddingTop: 14,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  tabDivider: { width: 1, height: 24, backgroundColor: colors.glassBorder },
  tabText: { color: colors.gold, fontSize: 14, fontWeight: "700" },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  actionItem: { alignItems: "center", gap: 6 },
  actionCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: colors.glass,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  actionLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: "600" },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: colors.textPrimary },
  seeAll: { color: colors.gold, fontWeight: "700", fontSize: 13 },
  txList: { gap: 8 },
  empty: { color: colors.textSecondary, textAlign: "center", paddingVertical: 18 },
});
