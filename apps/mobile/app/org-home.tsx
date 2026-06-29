import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { currency } from "@moneyoung/shared";
import { StateView } from "../src/components/StateView";
import { TransactionRow } from "../src/components/TransactionRow";
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

function newestFirst<T extends { created_at: string }>(items: T[]) {
  return [...items].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

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
          <View style={styles.identity}>
            <Pressable onPress={() => router.push("/profile")} style={styles.avatar}>
              <Text style={styles.avatarText}>{orgName.charAt(0).toUpperCase()}</Text>
            </Pressable>
            <View>
              <Text style={styles.greeting}>Ola, {orgName}</Text>
              <Text style={styles.role}>{role || "Funcionario(a)"}</Text>
            </View>
          </View>
          <Pressable onPress={() => router.push("/notifications")} style={styles.iconBtn}>
            <Ionicons name="notifications-outline" size={22} color={colors.textPrimary} />
            <View style={styles.notificationDot} />
          </Pressable>
        </View>

        <GlassCard style={styles.orgBadge}>
          <View style={styles.orgBadgeInner}>
            <Ionicons name="school-outline" size={18} color={colors.gold} />
            <Text style={styles.orgName}>{orgName}</Text>
            <Text style={styles.roleBadge}>{role}</Text>
          </View>
        </GlassCard>

        <GlassCard glow style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Saldo da escola</Text>
            <Pressable onPress={() => router.push("/statement")}>
              <Text style={styles.balanceLink}>Ver extrato</Text>
            </Pressable>
          </View>
          <Text style={styles.balanceValue}>{currency.format(data?.wallet?.balance ?? 0)}</Text>
          <Text style={styles.balanceKey}>{orgName}</Text>
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
            <Text style={styles.seeAll}>Ver todas &gt;</Text>
          </Pressable>
        </View>

        {data?.recent_transactions?.length ? (
          <View style={styles.txList}>
            {newestFirst(data.recent_transactions).slice(0, 5).map((tx) => (
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
  identity: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
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
    shadowColor: colors.gold, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35, shadowRadius: 10,
  },
  avatarText: { color: colors.navyDeep, fontWeight: "900", fontSize: 15 },
  greeting: { fontSize: 15, color: colors.textPrimary, fontWeight: "900" },
  role: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },

  orgBadge: {
    padding: 0,
  },
  orgBadgeInner: {
    flexDirection: "row", alignItems: "center", gap: 8, padding: 14,
  },
  orgName: { color: colors.textPrimary, fontSize: 14, fontWeight: "900", flex: 1 },
  roleBadge: {
    backgroundColor: colors.glowGoldSoft, paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: 8, fontSize: 12, color: colors.goldLight, fontWeight: "800", overflow: "hidden",
  },

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
    color: colors.textPrimary, fontSize: 34, fontWeight: "900", marginVertical: 2,
    textShadowColor: colors.glowGold, textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  balanceKey: { color: colors.textSecondary, fontSize: 12, fontWeight: "600" },

  actionsRow: { flexDirection: "row", justifyContent: "space-between" },
  actionItem: { alignItems: "center", gap: 7, flex: 1 },
  actionCircle: {
    width: 48, height: 48, borderRadius: 14,
    backgroundColor: colors.input, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: colors.glassBorder,
    shadowColor: colors.gold, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.14, shadowRadius: 8,
  },
  actionLabel: { fontSize: 11, color: colors.textPrimary, fontWeight: "700" },

  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
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
