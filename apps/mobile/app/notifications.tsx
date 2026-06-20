import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { accountTypeLabels, AccountType, currency, LedgerTransaction } from "@moneyoung/shared";
import { PageHeader } from "../src/components/PageHeader";
import { Screen } from "../src/components/Screen";
import { StateView } from "../src/components/StateView";
import { getWalletSummary } from "../src/services/moneyoung";
import { colors } from "../src/theme/colors";

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Agora";
  if (mins < 60) return `${mins}min atras`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atras`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Ontem";
  return new Date(iso).toLocaleDateString("pt-BR");
}

const badgeColors: Record<AccountType, string> = {
  personal: colors.primary,
  business: "#E65100",
  sub_business: "#6A1B9A",
  system: colors.danger,
};

export default function Notifications() {
  const [walletId, setWalletId] = useState("");
  const [txs, setTxs] = useState<LedgerTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getWalletSummary()
      .then((s) => {
        setWalletId(s.wallet.id);
        setTxs(s.recent_transactions);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Erro ao carregar notificacoes."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Screen><StateView loading title="Carregando" /></Screen>;
  if (error) return <Screen><PageHeader title="Notificacoes" /><StateView title="Erro" message={error} /></Screen>;

  if (!txs.length) {
    return (
      <Screen>
        <PageHeader title="Notificacoes" />
        <Text style={styles.empty}>Nenhuma notificacao ainda.</Text>
      </Screen>
    );
  }

  return (
    <Screen>
      <PageHeader title="Notificacoes" />
      {txs.map((tx) => {
        const incoming = tx.to_wallet_id === walletId;
        const otherName = incoming ? tx.from_display_name : tx.to_display_name;
        const otherType = incoming ? tx.from_account_type : tx.to_account_type;

        let icon: keyof typeof Ionicons.glyphMap;
        let iconColor: string;
        let title: string;
        let message: string;

        if (tx.type === "initial_credit") {
          icon = "wallet";
          iconColor = colors.warning;
          title = "Credito inicial";
          message = `${currency.format(tx.amount)} foram creditados na sua carteira.`;
        } else if (incoming) {
          icon = "arrow-down";
          iconColor = colors.success;
          title = "Voce recebeu " + currency.format(tx.amount);
          message = otherName
            ? `${otherName} enviou para voce.`
            : tx.description || "Transferencia recebida.";
        } else {
          icon = "arrow-up";
          iconColor = colors.danger;
          title = "Voce enviou " + currency.format(tx.amount);
          message = otherName
            ? `Para ${otherName}.`
            : tx.description || "Transferencia enviada.";
        }

        const typeLabel = otherType ? accountTypeLabels[otherType] : null;
        const badge = otherType ? badgeColors[otherType] : null;

        return (
          <View key={tx.id} style={styles.row}>
            <View style={[styles.iconCircle, { backgroundColor: iconColor + "18" }]}>
              <Ionicons name={icon} size={20} color={iconColor} />
            </View>
            <View style={styles.content}>
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>
              {typeLabel && badge ? (
                <View style={[styles.badge, { backgroundColor: badge + "20" }]}>
                  <Text style={[styles.badgeText, { color: badge }]}>{typeLabel}</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.time}>{relativeTime(tx.created_at)}</Text>
          </View>
        );
      })}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1, gap: 4 },
  title: { fontSize: 15, fontWeight: "800", color: colors.ink },
  message: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  badge: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  time: { fontSize: 12, color: colors.muted },
  empty: { color: colors.muted, textAlign: "center", paddingVertical: 24 },
});
