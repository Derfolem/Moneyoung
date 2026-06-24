import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { HexLogo } from "./HexLogo";
import { colors } from "../theme/colors";

type MenuItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route?: string;
  onPress?: () => void;
  danger?: boolean;
};

type DrawerProps = {
  visible: boolean;
  onClose: () => void;
  userName: string;
  youngKey: string;
  onSignOut: () => void;
};

const DRAWER_WIDTH = 280;

export function Drawer({ visible, onClose, userName, youngKey, onSignOut }: DrawerProps) {
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const menuItems: MenuItem[] = [
    { icon: "home-outline", label: "Inicio", route: "/home" },
    { icon: "swap-horizontal-outline", label: "Transferir", route: "/transfer" },
    { icon: "card-outline", label: "Pagar", route: "/pay" },
    { icon: "download-outline", label: "Receber", route: "/receive" },
    { icon: "document-text-outline", label: "Extrato", route: "/statement" },
    { icon: "notifications-outline", label: "Notificacoes", route: "/notifications" },
    { icon: "person-outline", label: "Perfil", route: "/profile" },
  ];

  function navigate(route: string) {
    onClose();
    setTimeout(() => router.push(route), 150);
  }

  return (
    <View
      style={[styles.wrapper, { pointerEvents: visible ? "auto" : "none" }]}
    >
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <Pressable style={styles.overlayPress} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[styles.drawer, { transform: [{ translateX }] }]}
      >
        <View style={styles.header}>
          <HexLogo size={48} />
          <View style={styles.headerText}>
            <Text style={styles.userName}>{userName}</Text>
            <Text style={styles.youngKey}>{youngKey}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.menu}>
          {menuItems.map((item) => (
            <Pressable
              key={item.label}
              style={styles.menuItem}
              onPress={() => item.route && navigate(item.route)}
            >
              <Ionicons name={item.icon} size={22} color={colors.gold} />
              <Text style={styles.menuLabel}>{item.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.footer}>
          <View style={styles.divider} />
          <Pressable
            style={styles.menuItem}
            onPress={() => {
              onClose();
              setTimeout(onSignOut, 150);
            }}
          >
            <Ionicons name="log-out-outline" size={22} color={colors.danger} />
            <Text style={[styles.menuLabel, { color: colors.danger }]}>Sair da conta</Text>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  overlayPress: {
    flex: 1,
  },
  drawer: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: colors.glassStrong,
    paddingTop: 60,
    paddingBottom: 30,
    borderRightWidth: 1,
    borderRightColor: colors.glassBorder,
    // @ts-ignore
    backdropFilter: "blur(24px)",
    // @ts-ignore
    WebkitBackdropFilter: "blur(24px)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  headerText: {
    flex: 1,
    gap: 2,
  },
  userName: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "900",
  },
  youngKey: {
    color: colors.gold,
    fontSize: 13,
    fontWeight: "600",
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 24,
  },
  menu: {
    flex: 1,
    paddingTop: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  menuLabel: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    gap: 12,
  },
});
