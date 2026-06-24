import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

type NavItem = {
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  label: string;
  route: string;
};

const personalItems: NavItem[] = [
  { icon: "home-outline", iconActive: "home", label: "Inicio", route: "/home" },
  { icon: "swap-horizontal-outline", iconActive: "swap-horizontal", label: "Transferir", route: "/transfer" },
  { icon: "qr-code-outline", iconActive: "qr-code", label: "Pagar", route: "/pay" },
  { icon: "document-text-outline", iconActive: "document-text", label: "Extrato", route: "/statement" },
  { icon: "person-outline", iconActive: "person", label: "Perfil", route: "/profile" },
];

const staffItems: NavItem[] = [
  { icon: "home-outline", iconActive: "home", label: "Inicio", route: "/org-home" },
  { icon: "swap-horizontal-outline", iconActive: "swap-horizontal", label: "Transferir", route: "/transfer" },
  { icon: "download-outline", iconActive: "download", label: "Receber", route: "/receive" },
  { icon: "people-outline", iconActive: "people", label: "Alunos", route: "/students" },
  { icon: "person-outline", iconActive: "person", label: "Perfil", route: "/profile" },
];

export function BottomNav({ staff }: { staff?: boolean }) {
  const items = staff ? staffItems : personalItems;
  const pathname = usePathname();

  return (
    <View style={styles.container}>
      <View style={styles.topGlow} />
      <View style={styles.bar}>
        {items.map((item) => {
          const active = pathname === item.route;
          return (
            <Pressable
              key={item.route}
              style={styles.item}
              onPress={() => router.replace(item.route)}
            >
              {active && <View style={styles.activeLine} />}
              <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
                <Ionicons
                  name={active ? item.iconActive : item.icon}
                  size={22}
                  color={active ? colors.gold : colors.textSecondary}
                />
              </View>
              <Text style={[styles.label, active && styles.labelActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.glassStrong,
    borderTopWidth: 1,
    borderTopColor: colors.glassBorder,
    // @ts-ignore
    backdropFilter: "blur(20px)",
    // @ts-ignore
    WebkitBackdropFilter: "blur(20px)",
  },
  topGlow: {
    position: "absolute",
    top: -1,
    left: "10%",
    right: "10%",
    height: 1,
    backgroundColor: colors.glowGoldSoft,
    borderRadius: 1,
  },
  bar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 20,
  },
  item: {
    alignItems: "center",
    gap: 4,
    minWidth: 56,
    position: "relative",
  },
  activeLine: {
    position: "absolute",
    top: -9,
    width: 32,
    height: 2,
    backgroundColor: colors.gold,
    borderRadius: 1,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
  },
  iconWrap: {
    width: 36,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  iconWrapActive: {
    backgroundColor: colors.glowGoldSoft,
  },
  label: {
    fontSize: 10,
    fontWeight: "600",
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.gold,
    fontWeight: "800",
  },
});
