import { ReactNode } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { colors } from "../theme/colors";

type Props = {
  children: ReactNode;
  style?: ViewStyle;
  intensity?: "soft" | "medium" | "strong";
  glow?: boolean;
  noPadding?: boolean;
};

export function GlassCard({ children, style, intensity = "medium", glow, noPadding }: Props) {
  const bg =
    intensity === "soft" ? colors.glass :
    intensity === "strong" ? colors.glassStrong :
    colors.glass;

  return (
    <View style={[styles.card, { backgroundColor: bg }, glow && styles.glow, noPadding && styles.noPad, style]}>
      <View style={styles.highlight} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: "hidden",
    // @ts-ignore — web-only property
    backdropFilter: "blur(16px)",
    // @ts-ignore
    WebkitBackdropFilter: "blur(16px)",
  },
  highlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: colors.glassHighlight,
  },
  glow: {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 8,
    borderColor: colors.glowGoldSoft,
  },
  noPad: {
    padding: 0,
  },
});
