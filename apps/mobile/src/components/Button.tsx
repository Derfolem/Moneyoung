import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, ActivityIndicator } from "react-native";
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
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (tone !== "primary" || inactive) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 1800, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 1800, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [tone, inactive]);

  const spinnerColor = tone === "primary" ? colors.navyDeep : colors.gold;
  const textColor =
    tone === "primary" ? colors.navyDeep :
    tone === "ghost" ? colors.gold :
    tone === "danger" ? "#fff" :
    colors.textPrimary;

  const animatedShadow = tone === "primary" ? {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.15, 0.45] }),
    shadowRadius: glowAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 22] }),
  } : {};

  return (
    <Animated.View style={[
      tone === "primary" && styles.glowWrap,
      animatedShadow,
    ]}>
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
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glowWrap: {
    borderRadius: 16,
    elevation: 8,
  },
  button: {
    minHeight: 52,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  primary: {
    backgroundColor: colors.gold,
  },
  secondary: {
    backgroundColor: colors.glass,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    // @ts-ignore
    backdropFilter: "blur(12px)",
    // @ts-ignore
    WebkitBackdropFilter: "blur(12px)",
  },
  danger: { backgroundColor: colors.danger },
  ghost: { backgroundColor: "transparent" },
  disabled: { opacity: 0.55 },
  text: { fontWeight: "800", fontSize: 16 },
});
