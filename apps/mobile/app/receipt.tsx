import { router, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "../src/components/Button";
import { TextLogo } from "../src/components/TextLogo";
import { toast } from "../src/services/toast";
import { colors } from "../src/theme/colors";

export default function Receipt() {
  const { to, amount, description, date, from } = useLocalSearchParams<{
    to: string;
    amount: string;
    description: string;
    date: string;
    from: string;
  }>();

  const formattedDate = date
    ? new Date(date).toLocaleString("pt-BR")
    : new Date().toLocaleString("pt-BR");

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.watermark}>
          <TextLogo size={18} color="rgba(212,168,67,0.2)" />
        </View>
        <Text style={styles.headerTitle}>Comprovante</Text>
        <Text style={styles.headerSub}>Transferencia realizada</Text>
      </View>

      {/* Card */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.label}>Valor</Text>
          <Text style={styles.value}>{amount} YC</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Data</Text>
          <Text style={styles.value}>{formattedDate}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Origem</Text>
          <Text style={styles.value}>{from || "—"}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Destino</Text>
          <Text style={styles.value}>{to}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Descricao</Text>
          <Text style={styles.value}>{description || "Sem descricao"}</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Concluida</Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <Button
          title="Compartilhar"
          onPress={() => toast.info("Em breve", "Funcionalidade disponivel na proxima versao.")}
          tone="secondary"
        />
        <Button title="Voltar ao inicio" onPress={() => router.replace("/home")} tone="ghost" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navyDeep },
  header: {
    backgroundColor: colors.glassStrong,
    paddingTop: 70,
    paddingBottom: 60,
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  watermark: {
    position: "absolute",
    top: 40,
    right: 30,
    opacity: 1,
  },
  headerTitle: {
    color: colors.gold,
    fontSize: 28,
    fontWeight: "900",
    textShadowColor: colors.glowGold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  headerSub: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.glass,
    borderRadius: 20,
    marginHorizontal: 24,
    marginTop: -30,
    padding: 24,
    gap: 14,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    // @ts-ignore
    backdropFilter: "blur(16px)",
    // @ts-ignore
    WebkitBackdropFilter: "blur(16px)",
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  value: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "right",
    flex: 1,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.glassBorder,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  statusText: {
    color: colors.success,
    fontWeight: "700",
    fontSize: 15,
  },
  actions: {
    padding: 24,
    gap: 10,
    marginTop: "auto",
    marginBottom: 20,
  },
});
