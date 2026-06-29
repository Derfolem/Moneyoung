import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

export function DisclaimerBar() {
  return (
    <View style={styles.bar}>
      <Ionicons name="alert-circle-outline" size={12} color={colors.gold} />
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
    gap: 6,
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: "rgba(217,154,38,0.07)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(217,154,38,0.18)",
  },
  text: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textSecondary,
    flexShrink: 1,
  },
});
