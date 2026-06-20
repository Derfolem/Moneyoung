import { BarCodeScanner } from "expo-barcode-scanner";
import { router } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Button } from "../src/components/Button";
import { PageHeader } from "../src/components/PageHeader";
import { Screen } from "../src/components/Screen";
import { parseAmount, payMoneyoung } from "../src/services/moneyoung";
import { toast } from "../src/services/toast";
import { colors } from "../src/theme/colors";

export default function Pay() {
  const [permission, setPermission] = useState<"loading" | "granted" | "denied">("loading");
  const [youngKey, setYoungKey] = useState("");
  const [amount, setAmount] = useState("");
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    BarCodeScanner.requestPermissionsAsync()
      .then(({ status }) => setPermission(status === "granted" ? "granted" : "denied"))
      .catch(() => setPermission("denied"));
  }, []);

  async function pay() {
    try {
      const parsedAmount = parseAmount(amount);
      if (!youngKey.trim()) throw new Error("Informe ou leia uma chave Moneyoung.");
      if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) throw new Error("Informe um valor maior que zero.");

      setLoading(true);
      await payMoneyoung({ to_young_key: youngKey.trim(), amount: parsedAmount, description: "Pagamento via QR Code" });
      toast.success("Pagamento enviado");
      router.replace("/home");
    } catch (err) {
      toast.error("Erro no pagamento", err instanceof Error ? err.message : "Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen scroll={false}>
      <View style={styles.content}>
        <PageHeader title="Pagar" />

        {permission === "granted" && !scanned ? (
          <View style={styles.scannerWrap}>
            <BarCodeScanner
              style={styles.camera}
              onBarCodeScanned={({ data }) => {
                setYoungKey(data.trim());
                setScanned(true);
              }}
            />
            <View style={styles.overlay}>
              <View style={styles.overlayTop} />
              <View style={styles.overlayMiddle}>
                <View style={styles.overlaySide} />
                <View style={styles.scanFrame}>
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />
                </View>
                <View style={styles.overlaySide} />
              </View>
              <View style={styles.overlayBottom}>
                <Text style={styles.scanHint}>Aponte para o QR Code Moneyoung</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.form}>
            {permission === "loading" ? (
              <Text style={styles.helper}>Solicitando permissao da camera...</Text>
            ) : null}
            {permission === "denied" ? (
              <Text style={styles.helper}>
                Camera indisponivel. Voce ainda pode pagar informando a chave manualmente.
              </Text>
            ) : null}

            <Text style={styles.label}>Chave Moneyoung</Text>
            <TextInput
              style={styles.input}
              value={youngKey}
              onChangeText={setYoungKey}
              placeholder="@chaveyoung"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
            />

            <Text style={styles.label}>Valor</Text>
            <TextInput
              style={styles.input}
              value={amount}
              onChangeText={setAmount}
              placeholder="0,00"
              placeholderTextColor={colors.muted}
              keyboardType="decimal-pad"
            />

            <Button title="Confirmar pagamento" onPress={pay} loading={loading} disabled={!youngKey.trim() || !amount.trim()} />
            {permission === "granted" ? (
              <Button title="Ler outro QR Code" onPress={() => setScanned(false)} tone="secondary" />
            ) : null}
          </View>
        )}
      </View>
    </Screen>
  );
}

const CORNER_SIZE = 24;
const CORNER_THICK = 3;

const styles = StyleSheet.create({
  content: { flex: 1, padding: 24, gap: 20 },
  scannerWrap: { flex: 1, borderRadius: 16, overflow: "hidden", position: "relative" },
  camera: { flex: 1, minHeight: 360 },
  overlay: { ...StyleSheet.absoluteFillObject },
  overlayTop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)" },
  overlayMiddle: { flexDirection: "row" },
  overlaySide: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)" },
  scanFrame: { width: 220, height: 220, position: "relative" },
  overlayBottom: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", paddingTop: 20 },
  scanHint: { color: "#fff", fontSize: 14, fontWeight: "600" },
  corner: { position: "absolute", width: CORNER_SIZE, height: CORNER_SIZE },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICK, borderLeftWidth: CORNER_THICK, borderColor: colors.primary },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICK, borderRightWidth: CORNER_THICK, borderColor: colors.primary },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICK, borderLeftWidth: CORNER_THICK, borderColor: colors.primary },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICK, borderRightWidth: CORNER_THICK, borderColor: colors.primary },
  form: { gap: 10 },
  helper: { color: colors.muted, lineHeight: 22 },
  label: { fontSize: 14, color: colors.muted, fontWeight: "600", marginTop: 4 },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.ink,
  },
});
