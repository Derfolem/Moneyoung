import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { currency } from "@moneyoung/shared";
import { StateView } from "../src/components/StateView";
import { TransactionRow } from "../src/components/TransactionRow";
import { TextLogo } from "../src/components/TextLogo";
import { BottomNav } from "../src/components/BottomNav";
import { GlassCard } from "../src/components/GlassCard";
import { AmbientOrbs, GoldDust } from "../src/components/GoldDust";
import { getOrgWalletSummary } from "../src/services/moneyoung";
import { colors } from "../src/theme/colors";

const roleLabel: Record<string, string> = {
  teacher: "Professor(a)",
  staff: "Funcionario(a)",
  admin: "Diretor(a)",
};

export default function OrgHome() {
  const [data, setData] = useState<Awaited<ReturnType<typeof getOrgWalletSummary>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (refresh = false) => {
    if (refresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      setData(await getOrgWalletSummary());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao carregar dados da escola.";
      setError(msg);
      if (msg.toLowerCase().includes("unauth")) router.replace("/login");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading && !data) {
    return (
      <View style={styles.root}>
        <View style={styles.body}><StateView loading title="Carregando conta da escola" /></View>
        <BottomNav staff />
      </View>
    );
  }
  if (error && !data) {
    return (
      <View style={styles.root}>
        <View style={styles.body}>
          <StateView title="Conta indisponivel" message={error} actionLabel="Tentar novamente" onAction={() => load()} />
        </View>
        <BottomNav staff />
      </View>
    );
  }

  const orgName = data?.organization?.name ?? "Escola";
  const role = roleLabel[data?.member_role ?? ""] ?? data?.member_role ?? "";

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
              <Text style={styles.avatarText}>{orgName.charAt(0).toUpperCase()}</Text>
            </Pressable>
          </View>
        </View>

        <GlassCard style={styles.orgBadge} noPadding>
          <View style={styles.orgBadgeInner}>
            <Ionicons name="school-outline" size={18} color={colors.gold} />
            <Text style={styles.orgName}>{orgName}</Text>
            <Text style={styles.roleBadge}>{role}</Text>
          </View>
        </GlassCard>

        <GlassCard glow style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Saldo da Escola</Text>
          <Text style={styles.balanceValue}>{currency.format(data?.wallet?.balance ?? 0)}</Text>

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
          <Pressable style={styles.actionItem} onPress={() => router.push("/transfer")}>
            <View style={styles.actionCircle}>
              <Ionicons name="swap-horizontal" size={22} color={colors.gold} />
            </View>
            <Text style={styles.actionLabel}>Transferir</Text>
          </Pressable>
          <Pressable style={styles.actionItem} onPress={() => router.push("/receive")}>
            <View style={styles.actionCircle}>
              <Ionicons name="download-outline" size={22} color={colors.gold} />
            </View>
            <Text style={styles.actionLabel}>Receber</Text>
          </Pressable>
          <Pressable style={styles.actionItem} onPress={() => router.push("/students")}>
            <View style={styles.actionCircle}>
              <Ionicons name="people-outline" size={22} color={colors.gold} />
            </View>
            <Text style={styles.actionLabel}>Alunos</Text>
          </Pressable>
          <Pressable style={styles.actionItem} onPress={() => router.push("/statement")}>
            <View style={styles.actionCircle}>
              <Ionicons name="document-text-outline" size={22} color={colors.gold} />
            </View>
            <Text style={styles.actionLabel}>Extrato</Text>
          </Pressable>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ultimas transacoes</Text>
          <Pressable onPress={() => router.push("/statement")}>
            <Text style={styles.seeAll}>Ver tudo</Text>
          </Pressable>
        </View>

        {data?.recent_transactions?.length ? (
          <View style={styles.txList}>
            {data.recent_transactions.slice(0, 5).map((tx) => (
              <TransactionRow key={tx.id} tx={tx} walletId={data.wallet?.id ?? ""} />
            ))}
          </View>
        ) : (
          <Text style={styles.empty}>Nenhuma transacao registrada.</Text>
        )}
      </ScrollView>

      <BottomNav staff />
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
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.glass, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: colors.glassBorder,
  },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.gold, alignItems: "center", justifyContent: "center",
    shadowColor: colors.gold, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35, shadowRadius: 10,
  },
  avatarText: { color: colors.navyDeep, fontWeight: "900", fontSize: 15 },

  orgBadge: {
    padding: 0,
  },
  orgBadgeInner: {
    flexDirection: "row", alignItems: "center", gap: 8, padding: 14,
  },
  orgName: { color: colors.textPrimary, fontSize: 16, fontWeight: "800" },
  roleBadge: {
    backgroundColor: colors.glowGoldSoft, paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 8, fontSize: 12, color: colors.gold, fontWeight: "700", overflow: "hidden",
  },

  balanceCard: {
    gap: 6,
  },
  balanceLabel: { color: colors.textSecondary, fontSize: 13 },
  balanceValue: {
    color: colors.gold, fontSize: 34, fontWeight: "900", marginVertical: 2,
    textShadowColor: colors.glowGold, textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  tabRow: {
    flexDirection: "row", marginTop: 14,
    borderTopWidth: 1, borderTopColor: colors.glassBorder, paddingTop: 14,
  },
  tab: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  tabDivider: { width: 1, height: 24, backgroundColor: colors.glassBorder },
  tabText: { color: colors.gold, fontSize: 14, fontWeight: "700" },

  actionsRow: { flexDirection: "row", justifyContent: "space-around" },
  actionItem: { alignItems: "center", gap: 6 },
  actionCircle: {
    width: 54, height: 54, borderRadius: 27,
    backgroundColor: colors.glass, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: colors.glassBorder,
    shadowColor: colors.gold, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1, shadowRadius: 8,
  },
  actionLabel: { fontSize: 11, color: colors.textSecondary, fontWeight: "600" },

  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontSize: 18, fontWeight: "900", color: colors.textPrimary },
  seeAll: { color: colors.gold, fontWeight: "700", fontSize: 13 },
  txList: { gap: 8 },
  empty: { color: colors.textSecondary, textAlign: "center", paddingVertical: 18 },
});
