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

export function PageHeader({ title, subtitle, backTo = "/home" }: Props) {
  return (
    <View style={styles.root}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Voltar"
        onPress={() => router.replace(backTo)}
        style={styles.back}
      >
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
      </Pressable>
      <View style={styles.copy}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 6 },
  back: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  copy: { flex: 1, gap: 4 },
  title: { fontSize: 18, fontWeight: "900", color: colors.textPrimary },
  subtitle: { lineHeight: 21, color: colors.textSecondary },
});
