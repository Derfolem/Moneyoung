import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Button } from "../src/components/Button";
import { PageHeader } from "../src/components/PageHeader";
import { Screen } from "../src/components/Screen";
import { BottomNav } from "../src/components/BottomNav";
import { parseAmount, getSchoolContacts, SchoolContact } from "../src/services/moneyoung";
import { toast } from "../src/services/toast";
import { colors } from "../src/theme/colors";

const roleLabel: Record<string, string> = {
  teacher: "Prof.",
  staff: "Func.",
  admin: "Dir.",
  student: "Aluno",
};

function initials(name: string) {
  const parts = name.trim().split(" ");
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function ContactCard({ contact, onPress, selected }: {
  contact: SchoolContact;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable
      style={[styles.contactCard, selected && styles.contactCardSelected]}
      onPress={onPress}
    >
      <View style={[styles.contactAvatar, selected && styles.contactAvatarSelected]}>
        <Text style={[styles.contactInitials, selected && styles.contactInitialsSelected]}>
          {initials(contact.display_name)}
        </Text>
      </View>
      <Text style={[styles.contactName, selected && styles.contactNameSelected]} numberOfLines={1}>
        {contact.display_name.split(" ")[0]}
      </Text>
      <Text style={styles.contactRole}>{roleLabel[contact.member_role] ?? contact.member_role}</Text>
    </Pressable>
  );
}

export default function Transfer() {
  const params = useLocalSearchParams<{ to?: string }>();
  const [to, setTo] = useState(params.to ?? "");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [contacts, setContacts] = useState<SchoolContact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const amountRef = useRef<TextInput>(null);

  useEffect(() => {
    getSchoolContacts()
      .then((res) => setContacts(res.contacts))
      .catch(() => {})
      .finally(() => setLoadingContacts(false));
  }, []);

  function selectContact(contact: SchoolContact) {
    setTo(contact.young_key);
    setTimeout(() => amountRef.current?.focus(), 100);
  }

  function goToConfirm() {
    const parsedAmount = parseAmount(amount);
    if (!to.trim()) {
      toast.error("Chave obrigatoria", "Informe a chave MoneYoung de destino.");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      toast.error("Valor invalido", "Informe um valor maior que zero.");
      return;
    }
    router.push({
      pathname: "/transfer-confirm",
      params: { to: to.trim(), amount, description },
    });
  }

  const selectedKey = to.trim().toLowerCase();

  return (
    <View style={styles.root}>
      <Screen>
        <PageHeader title="Transferir" />

        <View style={styles.amountArea}>
          <Text style={styles.amountDisplay}>{amount || "0"}</Text>
          <Text style={styles.amountSuffix}>YC</Text>
        </View>

        <TextInput
          ref={amountRef}
          style={styles.hiddenInput}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
          placeholder="0,00"
          placeholderTextColor={colors.textSecondary}
        />

        {/* Lista de contatos da escola */}
        <View style={styles.contactsSection}>
          <Text style={styles.label}>
            {contacts.length > 0 && contacts[0].member_role === "student"
              ? "Alunos da escola"
              : "Colaboradores da escola"}
          </Text>

          {loadingContacts ? (
            <ActivityIndicator color={colors.gold} style={{ marginVertical: 12 }} />
          ) : contacts.length === 0 ? (
            <Text style={styles.emptyContacts}>Nenhum contato disponivel.</Text>
          ) : (
            <FlatList
              data={contacts}
              keyExtractor={(c) => c.profile_id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.contactsList}
              renderItem={({ item }) => (
                <ContactCard
                  contact={item}
                  onPress={() => selectContact(item)}
                  selected={item.young_key.toLowerCase() === selectedKey}
                />
              )}
            />
          )}
        </View>

        <View style={styles.fields}>
          <Text style={styles.label}>Chave MoneYoung</Text>
          <TextInput
            style={styles.input}
            placeholder="@chaveyoung"
            placeholderTextColor={colors.textSecondary}
            autoCapitalize="none"
            value={to}
            onChangeText={setTo}
          />

          <Text style={styles.label}>Descricao</Text>
          <TextInput
            style={styles.input}
            placeholder="Opcional"
            placeholderTextColor={colors.textSecondary}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        <View style={styles.shortcuts}>
          {["+10", "+50", "+100", "+200"].map((item) => (
            <Pressable
              key={item}
              style={styles.shortcut}
              onPress={() => setAmount(item.replace("+", ""))}
            >
              <Text style={styles.shortcutText}>{item}</Text>
            </Pressable>
          ))}
        </View>

        <Button
          title="Transferir"
          onPress={goToConfirm}
          disabled={!to.trim() || !amount.trim()}
        />
      </Screen>
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navyDeep },

  amountArea: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "flex-start",
    paddingTop: 22,
    paddingBottom: 8,
    gap: 8,
  },
  amountDisplay: {
    fontSize: 40,
    fontWeight: "900",
    color: colors.textPrimary,
    textShadowColor: colors.glowGold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  amountSuffix: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  hiddenInput: {
    backgroundColor: colors.input,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },

  contactsSection: { gap: 8 },
  contactsList: { gap: 10, paddingVertical: 4 },
  emptyContacts: {
    color: colors.textSecondary,
    fontSize: 13,
    paddingVertical: 8,
  },

  contactCard: {
    width: 72,
    alignItems: "center",
    gap: 5,
    padding: 8,
    borderRadius: 14,
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  contactCardSelected: {
    borderColor: colors.gold,
    backgroundColor: "rgba(217,154,38,0.12)",
  },
  contactAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.navyLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
  },
  contactAvatarSelected: {
    borderColor: colors.gold,
    backgroundColor: "rgba(217,154,38,0.2)",
  },
  contactInitials: {
    fontSize: 14,
    fontWeight: "900",
    color: colors.textSecondary,
  },
  contactInitialsSelected: { color: colors.gold },
  contactName: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  contactNameSelected: { color: colors.goldLight },
  contactRole: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: "600",
  },

  fields: { gap: 8 },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "600",
    marginTop: 4,
  },
  input: {
    backgroundColor: colors.input,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },

  shortcuts: { flexDirection: "row", gap: 10 },
  shortcut: {
    flex: 1,
    minHeight: 38,
    borderRadius: 10,
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
  },
  shortcutText: {
    color: colors.textPrimary,
    fontWeight: "900",
    fontSize: 13,
  },
});
