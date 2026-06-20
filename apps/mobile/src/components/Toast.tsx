import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { toast, ToastData } from "../services/toast";
import { colors } from "../theme/colors";

const DURATION = 4000;

const iconMap = {
  success: "checkmark-circle" as const,
  error: "alert-circle" as const,
  info: "information-circle" as const,
};

const colorMap = {
  success: colors.success,
  error: "#E53935",
  info: colors.primary,
};

export function ToastHost() {
  const [data, setData] = useState<ToastData | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-40)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    return toast.subscribe((next) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      setData(next);
      opacity.setValue(0);
      translateY.setValue(-40);
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: false }),
        Animated.timing(translateY, { toValue: 0, duration: 250, useNativeDriver: false }),
      ]).start();
      timerRef.current = setTimeout(dismiss, DURATION);
    });
  }, []);

  function dismiss() {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: false }),
      Animated.timing(translateY, { toValue: -40, duration: 200, useNativeDriver: false }),
    ]).start(() => setData(null));
  }

  if (!data) return null;

  const accent = colorMap[data.type];

  return (
    <Animated.View style={[styles.container, { opacity, transform: [{ translateY }] }]}>
      <Pressable style={[styles.toast, { borderLeftColor: accent }]} onPress={dismiss}>
        <Ionicons name={iconMap[data.type]} size={22} color={accent} />
        <View style={styles.textWrap}>
          <Text style={styles.title}>{data.title}</Text>
          {data.message ? <Text style={styles.message}>{data.message}</Text> : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: "center",
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderLeftWidth: 4,
    maxWidth: 480,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.ink,
  },
  message: {
    fontSize: 13,
    color: colors.muted,
    lineHeight: 18,
  },
});
