import { Pressable, StyleSheet, Text, ActivityIndicator } from "react-native";
import { colors } from "../theme/colors";

type Props = {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  tone?: "primary" | "secondary" | "danger" | "ghost";
};

export function Button({ title, onPress, loading, disabled, tone = "primary" }: Props) {
  const inactive = Boolean(loading || disabled);
  const isLight = tone === "secondary" || tone === "ghost";
  const spinnerColor = isLight ? colors.primary : "#fff";
  const textColor = tone === "ghost" ? colors.primary : tone === "secondary" ? colors.ink : "#fff";

  return (
    <Pressable
      style={[styles.button, styles[tone], inactive && styles.disabled]}
      onPress={onPress}
      disabled={inactive}
    >
      {loading ? (
        <ActivityIndicator color={spinnerColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: { minHeight: 52, borderRadius: 12, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  primary: { backgroundColor: colors.primary },
  secondary: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  danger: { backgroundColor: colors.danger },
  ghost: { backgroundColor: "transparent" },
  disabled: { opacity: 0.55 },
  text: { fontWeight: "800", fontSize: 16 },
});
