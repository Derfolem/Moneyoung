import { router, useLocalSearchParams } from "expo-router";
import { Alert, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../src/components/Button";
import { HexLogo } from "../src/components/HexLogo";
import { colors } from "../src/theme/colors";

export default function Receipt() {
  const { to, amount, description, date } = useLocalSearchParams<{
    to: string;
    amount: string;
    description: string;
    date: string;
  }>();

  const formattedDate = date
    ? new Date(date).toLocaleString("pt-BR")
    : new Date().toLocaleString("pt-BR");

  return (
    <View style={styles.root}>
      {/* Dark header */}
      <View style={styles.header}>
        <View style={styles.watermark}>
          <HexLogo size={80} color="rgba(255,255,255,0.08)" textColor="rgba(255,255,255,0.15)" />
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
          <Text style={styles.value}>@miguel.aires</Text>
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
          onPress={() => Alert.alert("Em breve", "Funcionalidade disponivel na proxima versao.")}
          tone="secondary"
        />
        <Button title="Voltar ao inicio" onPress={() => router.replace("/home")} tone="ghost" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.navyDeep,
    paddingTop: 70,
    paddingBottom: 60,
    alignItems: "center",
    gap: 8,
  },
  watermark: {
    position: "absolute",
    top: 40,
    right: 30,
    opacity: 1,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
  },
  headerSub: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 14,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    marginHorizontal: 24,
    marginTop: -30,
    padding: 24,
    gap: 14,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 4,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: {
    fontSize: 14,
    color: colors.muted,
  },
  value: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
    textAlign: "right",
    flex: 1,
    marginLeft: 12,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
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
