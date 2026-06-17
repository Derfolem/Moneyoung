import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

type Props = {
  title: string;
  subtitle?: string;
  backTo?: string;
  darkHeader?: boolean;
};

export function PageHeader({ title, subtitle, backTo = "/home", darkHeader }: Props) {
  const tint = darkHeader ? "#fff" : colors.ink;
  const mutedTint = darkHeader ? "rgba(255,255,255,0.6)" : colors.muted;

  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        onPress={() => router.replace(backTo)}
        style={[styles.back, darkHeader && styles.backDark]}
      >
        <Ionicons name="chevron-back" size={24} color={tint} />
      </Pressable>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: tint }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: mutedTint }]}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: "row", alignItems: "center", gap: 12 },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
  backDark: {
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  copy: { flex: 1, gap: 4 },
  title: { fontSize: 28, fontWeight: "900" },
  subtitle: { lineHeight: 21 },
});
