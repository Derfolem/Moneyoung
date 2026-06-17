import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { PageHeader } from "../src/components/PageHeader";
import { Screen } from "../src/components/Screen";
import { colors } from "../src/theme/colors";

type Notification = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBg: string;
  title: string;
  message: string;
  time: string;
};

const demoNotifications: Notification[] = [
  {
    id: "1",
    icon: "arrow-down",
    iconColor: colors.success,
    iconBg: colors.success + "18",
    title: "Transferencia recebida",
    message: "Voce recebeu 120 YC de @professor.silva",
    time: "Hoje, 10:30",
  },
  {
    id: "2",
    icon: "checkmark-circle",
    iconColor: colors.primary,
    iconBg: colors.primary + "18",
    title: "Bem-vindo ao YoungCoin!",
    message: "Sua conta foi criada com sucesso.",
    time: "Ontem",
  },
  {
    id: "3",
    icon: "wallet",
    iconColor: colors.warning,
    iconBg: colors.warning + "18",
    title: "Credito inicial",
    message: "5.000 YC foram creditados na sua carteira.",
    time: "15/06",
  },
];

export default function Notifications() {
  return (
    <Screen>
      <PageHeader title="Notificacoes" />

      {demoNotifications.map((n) => (
        <View key={n.id} style={styles.row}>
          <View style={[styles.iconCircle, { backgroundColor: n.iconBg }]}>
            <Ionicons name={n.icon} size={20} color={n.iconColor} />
          </View>
          <View style={styles.content}>
            <Text style={styles.title}>{n.title}</Text>
            <Text style={styles.message}>{n.message}</Text>
          </View>
          <Text style={styles.time}>{n.time}</Text>
        </View>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    shadowColor: colors.cardShadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1, gap: 4 },
  title: { fontSize: 15, fontWeight: "800", color: colors.ink },
  message: { fontSize: 13, color: colors.muted, lineHeight: 18 },
  time: { fontSize: 12, color: colors.muted },
});
