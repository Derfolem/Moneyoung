import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { currency, WalletSummary } from "@youngcoin/shared";
import { Screen } from "../src/components/Screen";
import { StateView } from "../src/components/StateView";
import { TransactionRow } from "../src/components/TransactionRow";
import { HexLogo } from "../src/components/HexLogo";
import { Drawer } from "../src/components/Drawer";
import { getWalletSummary } from "../src/services/youngcoin";
import { signOut } from "../src/services/auth";
import { colors } from "../src/theme/colors";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

const actions = [
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
  const [drawerOpen, setDrawerOpen] = useState(false);

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
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

  async function handleSignOut() {
    try {
      await signOut();
      router.replace("/login");
    } catch (err) {
      Alert.alert("Erro", "Nao foi possivel sair.");
    }
  }

  if (loading && !summary) return <Screen><StateView loading title="Carregando carteira" /></Screen>;
  if (error && !summary) return <Screen><StateView title="Carteira indisponivel" message={error} actionLabel="Tentar novamente" onAction={() => load()} /></Screen>;

  const name = summary?.profile.display_name ?? "Usuario";
  const youngKey = summary?.profile.young_key ?? "";

  return (
    <View style={styles.root}>
      <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable onPress={() => setDrawerOpen(true)} style={styles.menuBtn}>
              <Ionicons name="menu-outline" size={26} color={colors.ink} />
            </Pressable>
            <View style={styles.greetingBlock}>
              <Text style={styles.greeting}>{getGreeting()},</Text>
              <Text style={styles.name}>{name}</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Pressable onPress={() => router.push("/notifications")} style={styles.bellBtn}>
              <Ionicons name="notifications-outline" size={24} color={colors.ink} />
            </Pressable>
            <Pressable onPress={() => router.push("/profile")} style={styles.avatar}>
              <Text style={styles.avatarText}>{name.charAt(0).toUpperCase()}</Text>
            </Pressable>
          </View>
        </View>

        {/* Balance Card */}
        <View style={styles.card}>
          <View style={styles.cardTop}>
            <Text style={styles.cardLabel}>Saldo disponivel</Text>
            <HexLogo size={28} color="rgba(255,255,255,0.15)" textColor="rgba(255,255,255,0.3)" />
          </View>
          <Text style={styles.balance}>{currency.format(summary?.wallet.balance ?? 0)}</Text>
          <Text style={styles.key}>{youngKey}</Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          {actions.map((a) => (
            <Pressable key={a.route} style={styles.actionItem} onPress={() => router.push(a.route)}>
              <View style={styles.actionCircle}>
                <Ionicons name={a.icon} size={24} color={colors.primary} />
              </View>
              <Text style={styles.actionLabel}>{a.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Recent Transactions */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ultimas transacoes</Text>
          <Pressable onPress={() => router.push("/statement")}>
            <Text style={styles.seeAll}>Ver tudo</Text>
          </Pressable>
        </View>

        {summary?.recent_transactions.length ? (
          summary.recent_transactions.slice(0, 5).map((tx) => (
            <TransactionRow key={tx.id} tx={tx} walletId={summary.wallet.id} />
          ))
        ) : (
          <Text style={styles.empty}>Nenhuma transacao registrada ainda.</Text>
        )}
      </Screen>

      {/* Side Drawer */}
      <Drawer
        visible={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        userName={name}
        youngKey={youngKey}
        onSignOut={handleSignOut}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  menuBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  greetingBlock: { gap: 2 },
  greeting: { fontSize: 16, color: colors.muted },
  name: { fontSize: 20, fontWeight: "900", color: colors.ink },
  headerRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  bellBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryDark,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontWeight: "900", fontSize: 16 },

  card: {
    backgroundColor: colors.primaryDark,
    borderRadius: 16,
    padding: 24,
    gap: 8,
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLabel: { color: "rgba(255,255,255,0.7)", fontSize: 14 },
  balance: { color: "#fff", fontSize: 36, fontWeight: "900" },
  key: { color: "rgba(255,255,255,0.8)", fontWeight: "800", fontSize: 14 },

  actionsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 4,
  },
  actionItem: { alignItems: "center", gap: 8 },
  actionCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { fontSize: 13, color: colors.ink, fontWeight: "600" },

  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 20, fontWeight: "900", color: colors.ink },
  seeAll: { color: colors.primary, fontWeight: "700", fontSize: 14 },
  empty: { color: colors.muted, textAlign: "center", paddingVertical: 18 },
});
