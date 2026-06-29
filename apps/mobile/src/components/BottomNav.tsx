import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, usePathname } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme/colors";

type NavItem = {
  icon: keyof typeof Ionicons.glyphMap;
  iconActive: keyof typeof Ionicons.glyphMap;
  label: string;
  route: string;
  featured?: boolean;
};

const personalItems: NavItem[] = [
  { icon: "home-outline", iconActive: "home", label: "Inicio", route: "/home" },
  { icon: "document-text-outline", iconActive: "document-text", label: "Extrato", route: "/statement" },
  { icon: "logo-usd", iconActive: "logo-usd", label: "Young", route: "/transfer", featured: true },
  { icon: "qr-code-outline", iconActive: "qr-code", label: "QR Code", route: "/receive" },
  { icon: "person-outline", iconActive: "person", label: "Perfil", route: "/profile" },
];

const staffItems: NavItem[] = [
  { icon: "home-outline", iconActive: "home", label: "Inicio", route: "/org-home" },
  { icon: "document-text-outline", iconActive: "document-text", label: "Extrato", route: "/statement" },
  { icon: "logo-usd", iconActive: "logo-usd", label: "Young", route: "/transfer", featured: true },
  { icon: "qr-code-outline", iconActive: "qr-code", label: "QR Code", route: "/receive" },
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
              {active && !item.featured && <View style={styles.activeLine} />}
              <View style={[
                styles.iconWrap,
                active && styles.iconWrapActive,
                item.featured && styles.featuredIcon,
              ]}>
                {item.featured ? (
                  <Text style={styles.coinText}>YC</Text>
                ) : (
                  <Ionicons
                    name={active ? item.iconActive : item.icon}
                    size={21}
                    color={active ? colors.gold : colors.textSecondary}
                  />
                )}
              </View>
              {!item.featured ? (
                <Text style={[styles.label, active && styles.labelActive]}>
                  {item.label}
                </Text>
              ) : null}
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.24,
    shadowRadius: 22,
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
    paddingTop: 6,
    paddingBottom: 18,
    maxWidth: 430,
    width: "100%",
    alignSelf: "center",
  },
  item: {
    alignItems: "center",
    gap: 3,
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
    width: 34,
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
  featuredIcon: {
    width: 58,
    height: 58,
    borderRadius: 29,
    marginTop: -26,
    backgroundColor: colors.gold,
    borderWidth: 2,
    borderColor: colors.goldLight,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.42,
    shadowRadius: 18,
    elevation: 10,
  },
  coinText: {
    color: colors.navyDeep,
    fontSize: 18,
    fontWeight: "900",
  },
});
