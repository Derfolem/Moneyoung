import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

interface HexLogoProps {
  size?: number;
  color?: string;
  textColor?: string;
}

export function HexLogo({
  size = 80,
  color = colors.gold,
  textColor = "#FFFFFF",
}: HexLogoProps) {
  const fontSize = size * 0.28;
  const outer = size * 0.82;
  const mid = size * 0.68;
  const inner = size * 0.54;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <View
        style={[
          styles.facet,
          {
            width: outer,
            height: outer,
            borderRadius: outer * 0.2,
            backgroundColor: color,
            transform: [{ rotate: "45deg" }],
          },
        ]}
      />
      <View
        style={[
          styles.facet,
          {
            width: mid,
            height: mid,
            borderRadius: mid * 0.2,
            backgroundColor: "rgba(255,255,255,0.12)",
            transform: [{ rotate: "45deg" }, { translateX: -size * 0.02 }, { translateY: -size * 0.03 }],
          },
        ]}
      />
      <View
        style={[
          styles.facet,
          {
            width: inner,
            height: inner,
            borderRadius: inner * 0.2,
            backgroundColor: "rgba(255,255,255,0.1)",
            transform: [{ rotate: "45deg" }, { translateX: -size * 0.03 }, { translateY: -size * 0.05 }],
          },
        ]}
      />
      <View
        style={[
          styles.facet,
          {
            width: outer * 0.7,
            height: 2,
            backgroundColor: "rgba(255,255,255,0.35)",
            transform: [{ rotate: "45deg" }, { translateX: -size * 0.12 }, { translateY: -size * 0.2 }],
            borderRadius: 1,
          },
        ]}
      />
      <View
        style={[
          styles.facet,
          {
            width: outer * 0.5,
            height: 1.5,
            backgroundColor: "rgba(0,0,0,0.2)",
            transform: [{ rotate: "45deg" }, { translateX: size * 0.1 }, { translateY: size * 0.18 }],
            borderRadius: 1,
          },
        ]}
      />
      <View
        style={[
          styles.facet,
          {
            width: outer + 4,
            height: outer + 4,
            borderRadius: (outer + 4) * 0.2,
            borderWidth: 1.5,
            borderColor: colors.borderGold,
            backgroundColor: "transparent",
            transform: [{ rotate: "45deg" }],
          },
        ]}
      />
      <Text style={[styles.text, { fontSize, color: textColor }]}>MYG</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
  },
  facet: {
    position: "absolute",
  },
  text: {
    fontWeight: "900",
    zIndex: 1,
    letterSpacing: 2,
  },
});
