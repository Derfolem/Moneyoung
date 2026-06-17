import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { currency, LedgerTransaction } from "@youngcoin/shared";
import { colors } from "../theme/colors";

type Props = {
  tx: LedgerTransaction;
  walletId?: string | undefined;
};

const labels: Record<LedgerTransaction["type"], string> = {
  admin_adjustment: "Ajuste",
  initial_credit: "Credito inicial",
  payment: "Pagamento",
  reversal: "Estorno",
  transfer: "Transferencia",
};

export function TransactionRow({ tx, walletId }: Props) {
  const outgoing = Boolean(walletId && tx.from_wallet_id === walletId);
  const amount = `${outgoing ? "-" : "+"} ${currency.format(tx.amount)}`;
  const iconName = outgoing ? "arrow-up" : "arrow-down";
  const tint = outgoing ? colors.danger : colors.success;

  return (
    <View style={styles.row}>
      <View style={[styles.iconCircle, { backgroundColor: tint + "18" }]}>
        <Ionicons name={iconName} size={18} color={tint} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.name}>{tx.description || labels[tx.type]}</Text>
        <Text style={styles.meta}>{labels[tx.type]} · {tx.status}</Text>
        <Text style={styles.date}>{new Date(tx.created_at).toLocaleString("pt-BR")}</Text>
      </View>
      <Text style={[styles.amount, { color: tint }]}>{amount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
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
  copy: { flex: 1, gap: 4 },
  name: { color: colors.ink, fontWeight: "800" },
  meta: { color: colors.muted, fontSize: 13 },
  date: { color: colors.muted, fontSize: 12 },
  amount: { fontWeight: "900", textAlign: "right" },
});
