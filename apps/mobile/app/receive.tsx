import * as Clipboard from "expo-clipboard";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../src/components/Screen";
import { PageHeader } from "../src/components/PageHeader";
import { StateView } from "../src/components/StateView";
import { HexLogo } from "../src/components/HexLogo";
import { getWalletSummary } from "../src/services/moneyoung";
import { toast } from "../src/services/toast";
import { colors } from "../src/theme/colors";

export default function Receive() {
  const [youngKey, setYoungKey] = useState("");
  const [qr, setQr] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const summary = await getWalletSummary();
        const nextQr = await QRCode.toDataURL(summary.profile.young_key);
        if (!mounted) return;
        setYoungKey(summary.profile.young_key);
        setQr(nextQr);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : "Nao foi possivel gerar seu QR Code.");
      } finally {
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => { mounted = false; };
  }, []);

  if (loading) return <Screen darkMode><StateView loading title="Gerando QR Code" /></Screen>;
  if (error) return <Screen darkMode><PageHeader title="Receber" darkHeader /><StateView title="Nao foi possivel carregar" message={error} /></Screen>;

  return (
    <Screen darkMode>
      <PageHeader title="Receber" darkHeader />

      <View style={styles.qrContainer}>
        <View style={styles.qrCard}>
          {qr ? <Image source={{ uri: qr }} style={styles.image} /> : null}
          <View style={styles.logoOverlay}>
            <HexLogo size={40} color={colors.primary} />
          </View>
        </View>
      </View>

      <Text style={styles.key}>{youngKey}</Text>

      <Pressable
        style={styles.copyBtn}
        onPress={async () => {
          await Clipboard.setStringAsync(youngKey);
          toast.success("Chave copiada");
        }}
      >
        <Ionicons name="copy-outline" size={20} color="#fff" />
        <Text style={styles.copyText}>Copiar chave</Text>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  qrContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  qrCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  image: { width: 280, height: 280 },
  logoOverlay: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  key: {
    textAlign: "center",
    fontSize: 20,
    fontWeight: "900",
    color: "#fff",
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderRadius: 12,
    minHeight: 52,
    paddingHorizontal: 24,
  },
  copyText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 16,
  },
});
