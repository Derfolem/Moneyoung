import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { accountTypeLabels, AccountType, currency, LedgerTransaction } from "@moneyoung/shared";
import { colors } from "../theme/colors";

type Props = {
  tx: LedgerTransaction;
  walletId?: string | undefined;
};

const typeLabels: Record<LedgerTransaction["type"], string> = {
  admin_adjustment: "Ajuste",
  initial_credit: "Credito inicial",
  payment: "Pagamento",
  reversal: "Estorno",
  transfer: "Transferencia",
};

const badgeColors: Record<AccountType, string> = {
  personal: colors.gold,
  business: "#E65100",
  sub_business: "#6A1B9A",
  system: colors.danger,
};

export function TransactionRow({ tx, walletId }: Props) {
  const outgoing = Boolean(walletId && tx.from_wallet_id === walletId);
  const amount = `${outgoing ? "-" : "+"} ${currency.format(tx.amount)}`;
  const iconName = outgoing ? "arrow-up" : "arrow-down";
  const tint = outgoing ? colors.danger : colors.success;

  const otherName = outgoing ? tx.to_display_name : tx.from_display_name;
  const otherKey = outgoing ? tx.to_young_key : tx.from_young_key;
  const otherType = outgoing ? tx.to_account_type : tx.from_account_type;

  const title = otherName
    ? `${otherName}`
    : tx.description || typeLabels[tx.type];

  const typeLabel = otherType ? accountTypeLabels[otherType] : null;
  const badge = otherType ? badgeColors[otherType] : null;

  return (
    <View style={styles.row}>
      <View style={[styles.iconCircle, { backgroundColor: tint + "18" }]}>
        <Ionicons name={iconName} size={18} color={tint} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.name} numberOfLines={1}>{title}</Text>
        <View style={styles.metaRow}>
          {typeLabel && badge ? (
            <View style={[styles.badge, { backgroundColor: badge + "20" }]}>
              <Text style={[styles.badgeText, { color: badge }]}>{typeLabel}</Text>
            </View>
          ) : null}
          <Text style={styles.meta} numberOfLines={1}>
            {typeLabels[tx.type]}{otherKey ? ` · ${otherKey}` : ""}
          </Text>
        </View>
        <Text style={styles.date}>{new Date(tx.created_at).toLocaleString("pt-BR")}</Text>
      </View>
      <Text style={[styles.amount, { color: tint }]}>{amount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    backgroundColor: colors.glass,
    borderRadius: 16,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    // @ts-ignore
    backdropFilter: "blur(12px)",
    // @ts-ignore
    WebkitBackdropFilter: "blur(12px)",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1, gap: 3 },
  name: { color: colors.textPrimary, fontWeight: "800", fontSize: 15 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "800",
    textTransform: "uppercase",
  },
  meta: { color: colors.textSecondary, fontSize: 12, flex: 1 },
  date: { color: colors.textSecondary, fontSize: 11 },
  amount: { fontWeight: "900", textAlign: "right", fontSize: 15 },
});
