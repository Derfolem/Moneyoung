import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { currency, LedgerTransaction } from "@moneyoung/shared";
import { PageHeader } from "../src/components/PageHeader";
import { Screen } from "../src/components/Screen";
import { StateView } from "../src/components/StateView";
import { BottomNav } from "../src/components/BottomNav";
import { getWalletSummary, getOrgWalletSummary } from "../src/services/moneyoung";
import { supabase } from "../src/services/supabase";
import { colors } from "../src/theme/colors";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Agora";
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Ontem";
  return new Date(iso).toLocaleDateString("pt-BR");
}

type Notif = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  message: string;
  time: string;
  type: "tx" | "bank" | "school";
};

function txToNotif(tx: LedgerTransaction, walletId: string): Notif {
  const incoming = tx.to_wallet_id === walletId;
  if (tx.type === "initial_credit") {
    return {
      id: tx.id, type: "bank",
      icon: "wallet", iconColor: colors.warning,
      title: "Credito inicial",
      message: `${currency.format(tx.amount)} creditados na carteira.`,
      time: relativeTime(tx.created_at),
    };
  }
  if (incoming) {
    return {
      id: tx.id, type: "tx",
      icon: "arrow-down", iconColor: colors.success,
      title: `Recebeu ${currency.format(tx.amount)}`,
      message: tx.from_display_name ? `De ${tx.from_display_name}` : tx.description || "Transferencia recebida.",
      time: relativeTime(tx.created_at),
    };
  }
  return {
    id: tx.id, type: "tx",
    icon: "arrow-up", iconColor: colors.danger,
    title: `Enviou ${currency.format(tx.amount)}`,
    message: tx.to_display_name ? `Para ${tx.to_display_name}` : tx.description || "Transferencia enviada.",
    time: relativeTime(tx.created_at),
  };
}

export default function Notifications() {
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [isStaff, setIsStaff] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cleared, setCleared] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    setError("");
    setCleared(false);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const uid = sess?.session?.user.id;
      if (!uid) return;
      const { data: prof } = await supabase
        .from("profiles").select("account_type").eq("id", uid).maybeSingle();

      let walletId = "";
      let txs: LedgerTransaction[] = [];

      if (prof?.account_type === "sub_business") {
        setIsStaff(true);
        const org = await getOrgWalletSummary();
        walletId = org.wallet.id;
        txs = org.recent_transactions ?? [];
      } else {
        const s = await getWalletSummary();
        walletId = s.wallet.id;
        txs = s.recent_transactions ?? [];
      }

      const items: Notif[] = [
        {
          id: "welcome",
          type: "bank",
          icon: "megaphone",
          iconColor: colors.gold,
          title: "Bem-vindo ao MoneYoung!",
          message: "Sua carteira digital educacional esta pronta. Use com responsabilidade.",
          time: "",
        },
        ...txs.map((tx) => txToNotif(tx, walletId)),
      ];
      setNotifs(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar notificacoes.");
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.rootWrap}>
        <Screen><StateView loading title="Carregando" /></Screen>
        <BottomNav staff={isStaff} />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.rootWrap}>
        <Screen>
          <PageHeader title="Notificacoes" />
          <StateView title="Erro" message={error} actionLabel="Tentar novamente" onAction={load} />
        </Screen>
        <BottomNav staff={isStaff} />
      </View>
    );
  }

  if (cleared || !notifs.length) {
    return (
      <View style={styles.rootWrap}>
        <Screen>
          <PageHeader title="Notificacoes" />
          <View style={styles.emptyWrap}>
            <Ionicons name="notifications-off-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.empty}>Nenhuma notificacao.</Text>
          </View>
        </Screen>
        <BottomNav staff={isStaff} />
      </View>
    );
  }

  return (
    <View style={styles.rootWrap}>
      <Screen>
        <View style={styles.headerRow}>
          <PageHeader title="Notificacoes" />
          <Pressable style={styles.clearBtn} onPress={() => setCleared(true)}>
            <Ionicons name="trash-outline" size={16} color={colors.danger} />
            <Text style={styles.clearText}>Limpar tudo</Text>
          </Pressable>
        </View>

        <View style={styles.list}>
          {notifs.map((n) => (
            <View key={n.id} style={styles.row}>
              <View style={[styles.iconCircle, { backgroundColor: n.iconColor + "18" }]}>
                <Ionicons name={n.icon} size={20} color={n.iconColor} />
              </View>
              <View style={styles.content}>
                <Text style={styles.title}>{n.title}</Text>
                <Text style={styles.message}>{n.message}</Text>
              </View>
              {n.time ? <Text style={styles.time}>{n.time}</Text> : null}
            </View>
          ))}
        </View>
      </Screen>
      <BottomNav staff={isStaff} />
    </View>
  );
}

const styles = StyleSheet.create({
  rootWrap: { flex: 1, backgroundColor: colors.navyDeep },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glowDanger,
    backgroundColor: colors.glass,
  },
  clearText: { color: colors.danger, fontSize: 12, fontWeight: "700" },
  list: { gap: 8 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: colors.glass,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    // @ts-ignore
    backdropFilter: "blur(12px)",
    // @ts-ignore
    WebkitBackdropFilter: "blur(12px)",
  },
  iconCircle: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  content: { flex: 1, gap: 4 },
  title: { fontSize: 15, fontWeight: "800", color: colors.textPrimary },
  message: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  time: { fontSize: 11, color: colors.textSecondary },
  emptyWrap: { alignItems: "center", gap: 12, paddingVertical: 40 },
  empty: { color: colors.textSecondary, textAlign: "center", fontSize: 15 },
});
