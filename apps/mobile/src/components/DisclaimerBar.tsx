import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

export function DisclaimerBar() {
  return (
    <View style={styles.bar}>
      <Ionicons name="alert-circle-outline" size={13} color={colors.gold} />
      <Text style={styles.text}>
        YoungCoin (YC) é uma moeda educacional e não possui valor monetário real
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 16,
    backgroundColor: "rgba(217,154,38,0.08)",
    borderTopWidth: 1,
    borderTopColor: "rgba(217,154,38,0.20)",
  },
  text: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary,
    flexShrink: 1,
  },
});
