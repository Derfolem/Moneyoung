import * as Clipboard from "expo-clipboard";
import QRCode from "qrcode";
import { useEffect, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Screen } from "../src/components/Screen";
import { PageHeader } from "../src/components/PageHeader";
import { StateView } from "../src/components/StateView";
import { TextLogo } from "../src/components/TextLogo";
import { BottomNav } from "../src/components/BottomNav";
import { supabase } from "../src/services/supabase";
import { toast } from "../src/services/toast";
import { colors } from "../src/theme/colors";

export default function Receive() {
  const [youngKey, setYoungKey] = useState("");
  const [qr, setQr] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isStaff, setIsStaff] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        setLoading(true);
        setError("");
        const { data: session } = await supabase.auth.getSession();
        const uid = session?.session?.user.id;
        if (!uid) throw new Error("Sessao expirada.");
        const { data: prof } = await supabase
          .from("profiles")
          .select("young_key,account_type")
          .eq("id", uid)
          .maybeSingle();
        if (!prof?.young_key) throw new Error("Chave nao encontrada.");
        const staff = prof.account_type === "sub_business";
        if (mounted) setIsStaff(staff);
        const nextQr = await QRCode.toDataURL(prof.young_key);
        if (!mounted) return;
        setYoungKey(prof.young_key);
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

  if (loading) {
    return (
      <View style={styles.rootWrap}>
        <Screen><StateView loading title="Gerando QR Code" /></Screen>
        <BottomNav />
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.rootWrap}>
        <Screen><PageHeader title="Receber" /><StateView title="Nao foi possivel carregar" message={error} /></Screen>
        <BottomNav />
      </View>
    );
  }

  return (
    <View style={styles.rootWrap}>
      <Screen>
        <PageHeader title="Receber" />

        <View style={styles.qrContainer}>
          <View style={styles.qrCard}>
            <TextLogo size={16} color={colors.navyDeep} />
            {qr ? <Image source={{ uri: qr }} style={styles.image} /> : null}
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
          <Ionicons name="copy-outline" size={20} color={colors.navyDeep} />
          <Text style={styles.copyText}>Copiar chave</Text>
        </Pressable>
      </Screen>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  rootWrap: { flex: 1, backgroundColor: colors.navyDeep },
  qrContainer: {
    alignItems: "center",
    paddingVertical: 16,
  },
  qrCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    borderWidth: 2,
    borderColor: colors.glassBorder,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  image: { width: 240, height: 240 },
  key: {
    textAlign: "center",
    fontSize: 18,
    fontWeight: "900",
    color: colors.gold,
    textShadowColor: colors.glowGold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  copyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: colors.gold,
    borderRadius: 16,
    minHeight: 52,
    paddingHorizontal: 24,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  copyText: {
    color: colors.navyDeep,
    fontWeight: "800",
    fontSize: 16,
  },
});
