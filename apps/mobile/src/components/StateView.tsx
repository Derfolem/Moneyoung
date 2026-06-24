import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Button } from "./Button";
import { colors } from "../theme/colors";

type Props = {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
};

export function StateView({ title, message, actionLabel, onAction, loading }: Props) {
  return (
    <View style={styles.root}>
      {loading ? <ActivityIndicator color={colors.gold} size="large" /> : null}
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? <Button title={actionLabel} onPress={onAction} tone="secondary" /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 280, justifyContent: "center", gap: 12 },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: "900", textAlign: "center" },
  message: { color: colors.textSecondary, fontSize: 16, lineHeight: 23, textAlign: "center" }
});
