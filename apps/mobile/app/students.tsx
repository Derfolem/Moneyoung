import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { currency } from "@moneyoung/shared";
import { BottomNav } from "../src/components/BottomNav";
import { PageHeader } from "../src/components/PageHeader";
import { StateView } from "../src/components/StateView";
import { Button } from "../src/components/Button";
import { getOrgWalletSummary } from "../src/services/moneyoung";
import { toast } from "../src/services/toast";
import { colors } from "../src/theme/colors";

type Student = {
  profile_id: string;
  display_name: string;
  full_name: string | null;
  young_key: string;
  balance: number;
  member_role: string;
  status: string;
};

export default function StudentsPage() {
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [correctPin, setCorrectPin] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getOrgWalletSummary();
      setCorrectPin(data.organization?.access_pin ?? null);
      const members = (data.members ?? []).filter(
        (m: Student) => m.member_role === "student" && m.status === "active"
      );
      setStudents(members);
      if (!data.organization?.access_pin) setUnlocked(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar alunos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function handleUnlock() {
    if (pin === correctPin) {
      setUnlocked(true);
    } else {
      toast.error("PIN incorreto", "Verifique o PIN com o diretor ou administrador.");
      setPin("");
    }
  }

  if (loading) {
    return (
      <View style={styles.root}>
        <View style={styles.body}><StateView loading title="Carregando alunos" /></View>
        <BottomNav staff />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.root}>
        <View style={styles.body}>
          <StateView title="Erro" message={error} actionLabel="Tentar novamente" onAction={load} />
        </View>
        <BottomNav staff />
      </View>
    );
  }

  if (!unlocked) {
    return (
      <View style={styles.root}>
        <View style={styles.pinContainer}>
          <Ionicons name="lock-closed-outline" size={48} color={colors.gold} />
          <Text style={styles.pinTitle}>Acesso Protegido</Text>
          <Text style={styles.pinDesc}>Digite o PIN da escola para ver os saldos dos alunos.</Text>
          <TextInput
            style={styles.pinInput}
            value={pin}
            onChangeText={(t) => setPin(t.replace(/\D/g, ""))}
            placeholder="PIN"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={8}
            autoFocus
          />
          <Button title="Desbloquear" onPress={handleUnlock} />
        </View>
        <BottomNav staff />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <PageHeader title={`Alunos (${students.length})`} />

        <Pressable style={styles.receiveBtn} onPress={() => router.push("/receive")}>
          <Ionicons name="qr-code-outline" size={18} color={colors.navyDeep} />
          <Text style={styles.receiveBtnText}>Receber pagamento</Text>
        </Pressable>

        <FlatList
          data={students}
          keyExtractor={(item) => item.profile_id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.cardLeft}>
                  <View style={styles.cardAvatar}>
                    <Text style={styles.cardAvatarText}>
                      {(item.full_name ?? item.display_name ?? "?").charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardName}>{item.full_name ?? item.display_name}</Text>
                    <Text style={styles.cardKey}>{item.young_key}</Text>
                  </View>
                  <Text style={styles.cardBalance}>{currency.format(item.balance)}</Text>
                </View>
              </View>
              <View style={styles.cardActions}>
                <Pressable
                  style={styles.actionBtn}
                  onPress={() => router.push({ pathname: "/transfer", params: { to: item.young_key } })}
                >
                  <Ionicons name="arrow-up-outline" size={16} color={colors.gold} />
                  <Text style={styles.actionText}>Transferir</Text>
                </Pressable>
                <Pressable
                  style={styles.actionBtn}
                  onPress={() => router.push("/receive")}
                >
                  <Ionicons name="arrow-down-outline" size={16} color={colors.gold} />
                  <Text style={styles.actionText}>Receber</Text>
                </Pressable>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.empty}>Nenhum aluno ativo vinculado a esta escola.</Text>
          }
        />
      </View>
      <BottomNav staff />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navyDeep },
  body: { flex: 1, justifyContent: "center", padding: 24 },
  content: { flex: 1, padding: 20 },
  list: { gap: 8, paddingBottom: 16 },

  pinContainer: {
    flex: 1, justifyContent: "center", alignItems: "center", padding: 32, gap: 16,
  },
  pinTitle: { color: colors.textPrimary, fontSize: 20, fontWeight: "900" },
  pinDesc: { color: colors.textSecondary, fontSize: 14, textAlign: "center", lineHeight: 20 },
  pinInput: {
    backgroundColor: colors.glass, borderRadius: 16, minHeight: 56,
    width: 160, textAlign: "center", fontSize: 24, fontWeight: "900",
    letterSpacing: 8, color: colors.textPrimary,
    borderWidth: 1, borderColor: colors.glassBorder,
  },

  receiveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: colors.gold, borderRadius: 14,
    paddingVertical: 12, marginBottom: 12,
  },
  receiveBtnText: { color: colors.navyDeep, fontWeight: "800", fontSize: 14 },

  card: {
    backgroundColor: colors.glass, borderRadius: 16,
    borderWidth: 1, borderColor: colors.glassBorder,
    overflow: "hidden",
  },
  cardTop: { padding: 14 },
  cardLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.navyLight, alignItems: "center", justifyContent: "center",
  },
  cardAvatarText: { color: colors.gold, fontWeight: "900", fontSize: 16 },
  cardName: { color: colors.textPrimary, fontSize: 14, fontWeight: "700" },
  cardKey: { color: colors.textSecondary, fontSize: 12 },
  cardBalance: { color: colors.gold, fontSize: 16, fontWeight: "900" },
  cardActions: {
    flexDirection: "row", borderTopWidth: 1, borderTopColor: colors.glassBorder,
  },
  actionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10,
  },
  actionText: { color: colors.gold, fontSize: 13, fontWeight: "700" },

  empty: { color: colors.textSecondary, textAlign: "center", paddingVertical: 24 },
});
