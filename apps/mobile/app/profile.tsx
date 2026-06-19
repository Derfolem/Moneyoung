import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WalletSummary } from "@moneyoung/shared";
import { Screen } from "../src/components/Screen";
import { StateView } from "../src/components/StateView";
import { signOut } from "../src/services/auth";
import { getWalletSummary } from "../src/services/moneyoung";
import { colors } from "../src/theme/colors";

type InfoItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

export default function Profile() {
  const [summary, setSummary] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getWalletSummary()
      .then(setSummary)
      .catch((err) => setError(err instanceof Error ? err.message : "Nao foi possivel carregar seu perfil."))
      .finally(() => setLoading(false));
  }, []);

  async function handleSignOut() {
    try {
      setSigningOut(true);
      await signOut();
      router.replace("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel sair.");
    } finally {
      setSigningOut(false);
    }
  }

  const profile = summary?.profile;
  if (loading) return <Screen><StateView loading title="Carregando perfil" /></Screen>;
  if (error && !profile) return <Screen><StateView title="Perfil indisponivel" message={error} /></Screen>;

  const name = profile?.display_name ?? "Usuário Moneyoung";
  const initial = name.charAt(0).toUpperCase();

  const items: InfoItem[] = [
    { icon: "key-outline", label: "Young Key", value: profile?.young_key ?? "" },
    { icon: "mail-outline", label: "Email", value: profile?.email ?? "" },
    { icon: "person-outline", label: "Tipo de conta", value: profile?.account_type ?? "" },
    { icon: "shield-checkmark-outline", label: "Status", value: profile?.status ?? "" },
  ];

  return (
    <View style={styles.root}>
      {/* Dark header */}
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.replace("/home")}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </Pressable>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.key}>{profile?.young_key}</Text>
      </View>

      {/* Info list */}
      <View style={styles.list}>
        {items.map((item) => (
          <View key={item.label} style={styles.row}>
            <View style={styles.iconCircle}>
              <Ionicons name={item.icon} size={20} color={colors.primary} />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.rowLabel}>{item.label}</Text>
              <Text style={styles.rowValue}>{item.value}</Text>
            </View>
          </View>
        ))}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {/* Sign out */}
      <Pressable style={styles.signOut} onPress={handleSignOut} disabled={signingOut}>
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={styles.signOutText}>{signingOut ? "Saindo..." : "Sair da conta"}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    backgroundColor: colors.navyDeep,
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    alignItems: "center",
    gap: 8,
  },
  backBtn: {
    position: "absolute",
    top: 56,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.primaryDark,
    borderWidth: 3,
    borderColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 36, fontWeight: "900" },
  name: { color: "#fff", fontSize: 24, fontWeight: "900" },
  key: { color: "rgba(255,255,255,0.7)", fontSize: 14, fontWeight: "600" },

  list: {
    padding: 24,
    gap: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + "14",
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 13, color: colors.muted },
  rowValue: { fontSize: 16, fontWeight: "700", color: colors.ink },

  error: { color: colors.danger, fontWeight: "700", textAlign: "center", paddingHorizontal: 24 },

  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    marginTop: "auto",
    marginBottom: 40,
  },
  signOutText: { color: colors.danger, fontWeight: "700", fontSize: 16 },
});
