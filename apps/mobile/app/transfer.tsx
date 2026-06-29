import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const SCREEN_HEIGHT = Dimensions.get("window").height;
import { Ionicons } from "@expo/vector-icons";
import { Button } from "../src/components/Button";
import { PageHeader } from "../src/components/PageHeader";
import { Screen } from "../src/components/Screen";
import { BottomNav } from "../src/components/BottomNav";
import { parseAmount, getSchoolContacts, SchoolContact } from "../src/services/moneyoung";
import { toast } from "../src/services/toast";
import { colors } from "../src/theme/colors";

const roleLabel: Record<string, string> = {
  teacher: "Professor(a)",
  staff: "Funcionario(a)",
  admin: "Diretor(a)",
  student: "Aluno(a)",
};

const roleLabelShort: Record<string, string> = {
  teacher: "Prof.",
  staff: "Func.",
  admin: "Dir.",
  student: "Aluno",
};

function initials(name: string) {
  const parts = name.trim().split(" ").filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function Avatar({ name, size = 40, selected = false }: { name: string; size?: number; selected?: boolean }) {
  return (
    <View style={[
      styles.avatar,
      { width: size, height: size, borderRadius: size / 2 },
      selected && styles.avatarSelected,
    ]}>
      <Text style={[styles.avatarText, { fontSize: size * 0.35 }, selected && styles.avatarTextSelected]}>
        {initials(name)}
      </Text>
    </View>
  );
}

function RecentCard({ contact, onPress, selected }: {
  contact: SchoolContact;
  onPress: () => void;
  selected: boolean;
}) {
  const firstName = contact.display_name.split(" ")[0];
  return (
    <Pressable style={[styles.recentCard, selected && styles.recentCardSelected]} onPress={onPress}>
      <Avatar name={contact.display_name} size={40} selected={selected} />
      <Text style={[styles.recentName, selected && styles.recentNameSelected]} numberOfLines={1}>
        {firstName}
      </Text>
      <Text style={styles.recentRole}>{roleLabelShort[contact.member_role] ?? contact.member_role}</Text>
    </Pressable>
  );
}

function ContactRow({ contact, onPress, selected }: {
  contact: SchoolContact;
  onPress: () => void;
  selected: boolean;
}) {
  return (
    <Pressable style={[styles.contactRow, selected && styles.contactRowSelected]} onPress={onPress}>
      <Avatar name={contact.display_name} size={44} selected={selected} />
      <View style={styles.contactInfo}>
        <Text style={[styles.contactName, selected && styles.contactNameSelected]} numberOfLines={1}>
          {contact.display_name}
        </Text>
        <Text style={styles.contactKey} numberOfLines={1}>{contact.young_key}</Text>
      </View>
      <View style={[styles.roleBadge, selected && styles.roleBadgeSelected]}>
        <Text style={[styles.roleBadgeText, selected && styles.roleBadgeTextSelected]}>
          {roleLabelShort[contact.member_role] ?? contact.member_role}
        </Text>
      </View>
      {selected && <Ionicons name="checkmark-circle" size={20} color={colors.gold} />}
    </Pressable>
  );
}

export default function Transfer() {
  const params = useLocalSearchParams<{ to?: string }>();
  const [to, setTo] = useState(params.to ?? "");
  const [selectedContact, setSelectedContact] = useState<SchoolContact | null>(null);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [contacts, setContacts] = useState<SchoolContact[]>([]);
  const [recentContacts, setRecentContacts] = useState<SchoolContact[]>([]);
  const [contactsLabel, setContactsLabel] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const amountRef = useRef<TextInput>(null);
  const searchRef = useRef<TextInput>(null);

  useEffect(() => {
    getSchoolContacts()
      .then((res) => {
        setContacts(res.contacts);
        setRecentContacts(res.recent_contacts ?? []);
        const isStudent = res.account_type === "personal";
        setContactsLabel(isStudent ? "Colaboradores da escola" : "Alunos da escola");
        // Se veio com ?to=, tenta pré-selecionar o contato
        if (params.to) {
          const found = res.contacts.find(
            (c) => c.young_key.toLowerCase() === params.to!.toLowerCase()
          );
          if (found) setSelectedContact(found);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingContacts(false));
  }, []);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(
      (c) =>
        c.display_name.toLowerCase().includes(q) ||
        c.young_key.toLowerCase().includes(q)
    );
  }, [contacts, searchQuery]);

  function selectContact(contact: SchoolContact) {
    setSelectedContact(contact);
    setTo(contact.young_key);
    setModalVisible(false);
    setSearchQuery("");
    Keyboard.dismiss();
    setTimeout(() => amountRef.current?.focus(), 150);
  }

  function clearContact() {
    setSelectedContact(null);
    setTo("");
  }

  function openModal() {
    setModalVisible(true);
    setTimeout(() => searchRef.current?.focus(), 200);
  }

  function closeModal() {
    setModalVisible(false);
    setSearchQuery("");
  }

  function goToConfirm() {
    const parsedAmount = parseAmount(amount);
    if (!to.trim()) {
      toast.error("Destinatario obrigatorio", "Selecione ou informe a chave MoneYoung de destino.");
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
          style={styles.numericInput}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
          placeholder="0,00"
          placeholderTextColor={colors.textSecondary}
        />

        {/* Cards de transferências recentes */}
        {recentContacts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Recentes</Text>
            <FlatList
              data={recentContacts}
              keyExtractor={(c) => `recent-${c.profile_id}`}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.recentList}
              renderItem={({ item }) => (
                <RecentCard
                  contact={item}
                  onPress={() => selectContact(item)}
                  selected={item.young_key.toLowerCase() === selectedKey}
                />
              )}
            />
          </View>
        )}

        {/* Dropdown de busca */}
        <View style={styles.section}>
          <Text style={styles.label}>Destinatario</Text>

          <Pressable style={styles.dropdown} onPress={openModal}>
            {selectedContact ? (
              <View style={styles.dropdownSelected}>
                <Avatar name={selectedContact.display_name} size={32} selected />
                <View style={styles.dropdownSelectedInfo}>
                  <Text style={styles.dropdownSelectedName} numberOfLines={1}>
                    {selectedContact.display_name}
                  </Text>
                  <Text style={styles.dropdownSelectedKey} numberOfLines={1}>
                    {selectedContact.young_key}
                  </Text>
                </View>
                <Pressable onPress={clearContact} hitSlop={12} style={styles.clearBtn}>
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </Pressable>
              </View>
            ) : (
              <>
                <Ionicons name="search" size={16} color={colors.textSecondary} />
                <Text style={styles.dropdownPlaceholder}>
                  {loadingContacts ? "Carregando..." : `Buscar em ${contactsLabel}...`}
                </Text>
                <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
              </>
            )}
          </Pressable>
        </View>

        <View style={styles.section}>
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

      {/* Bottom sheet de busca */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={closeModal}
        statusBarTranslucent
      >
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={closeModal} />

        {/* Painel */}
        <View style={styles.sheet}>
          {/* Handle */}
          <View style={styles.sheetHandle} />

          {/* Cabeçalho */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{contactsLabel}</Text>
            <Pressable onPress={closeModal} style={styles.modalClose}>
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </Pressable>
          </View>

          {/* Campo de busca */}
          <View style={styles.searchBar}>
            <Ionicons name="search" size={15} color={colors.textSecondary} />
            <TextInput
              ref={searchRef}
              style={styles.searchInput}
              placeholder="Buscar por nome ou chave..."
              placeholderTextColor={colors.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={15} color={colors.textSecondary} />
              </Pressable>
            )}
          </View>

          {/* Contador */}
          <Text style={styles.contactCount}>
            {searchQuery
              ? `${filtered.length} resultado${filtered.length !== 1 ? "s" : ""}`
              : `${contacts.length} ${contactsLabel.toLowerCase()}`}
          </Text>

          {/* Lista */}
          {loadingContacts ? (
            <View style={styles.loadingCenter}>
              <ActivityIndicator color={colors.gold} />
              <Text style={styles.loadingText}>Carregando contatos...</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={styles.loadingCenter}>
              <Ionicons name="person-outline" size={36} color={colors.textSecondary} />
              <Text style={styles.emptyText}>
                {searchQuery ? `Sem resultados para "${searchQuery}"` : "Nenhum contato disponivel."}
              </Text>
            </View>
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(c) => c.profile_id}
              contentContainerStyle={styles.modalList}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <ContactRow
                  contact={item}
                  onPress={() => selectContact(item)}
                  selected={item.young_key.toLowerCase() === selectedKey}
                />
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          )}
        </View>
      </Modal>

      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navyDeep },

  amountArea: {
    flexDirection: "row",
    alignItems: "baseline",
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
  amountSuffix: { fontSize: 24, fontWeight: "700", color: colors.textPrimary },

  numericInput: {
    backgroundColor: colors.input,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },

  section: { gap: 8 },
  sectionLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: "700" },
  label: { fontSize: 14, color: colors.textSecondary, fontWeight: "600" },

  // Cards de recentes
  recentList: { gap: 10, paddingVertical: 2 },
  recentCard: {
    width: 72,
    alignItems: "center",
    gap: 5,
    padding: 10,
    borderRadius: 14,
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  recentCardSelected: {
    borderColor: colors.gold,
    backgroundColor: "rgba(217,154,38,0.12)",
  },
  recentName: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  recentNameSelected: { color: colors.goldLight },
  recentRole: { fontSize: 10, color: colors.textSecondary, fontWeight: "600" },

  // Avatar
  avatar: {
    backgroundColor: colors.navyLight,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
  },
  avatarSelected: { borderColor: colors.gold, backgroundColor: "rgba(217,154,38,0.2)" },
  avatarText: { fontWeight: "900", color: colors.textSecondary },
  avatarTextSelected: { color: colors.gold },

  // Dropdown trigger
  dropdown: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.input,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    minHeight: 52,
  },
  dropdownPlaceholder: { flex: 1, color: colors.textSecondary, fontSize: 15 },
  dropdownSelected: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  dropdownSelectedInfo: { flex: 1 },
  dropdownSelectedName: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  dropdownSelectedKey: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  clearBtn: { padding: 2 },

  // Input descrição
  input: {
    backgroundColor: colors.input,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },

  // Atalhos de valor
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
  shortcutText: { color: colors.textPrimary, fontWeight: "900", fontSize: 13 },

  // Bottom sheet
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.72,
    backgroundColor: colors.navyCard,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.glassBorder,
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 4,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 8,
    paddingBottom: 10,
  },
  modalTitle: { fontSize: 15, fontWeight: "900", color: colors.textPrimary },
  modalClose: { padding: 4 },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 14,
    marginBottom: 6,
    backgroundColor: colors.input,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  searchInput: { flex: 1, fontSize: 14, color: colors.textPrimary, padding: 0 },

  contactCount: {
    fontSize: 11,
    color: colors.textSecondary,
    marginHorizontal: 18,
    marginBottom: 4,
    fontWeight: "600",
  },

  modalList: { paddingHorizontal: 14, paddingBottom: 16 },

  // Linha de contato na lista
  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 10,
  },
  contactRowSelected: { backgroundColor: "rgba(217,154,38,0.08)" },
  contactInfo: { flex: 1 },
  contactName: { fontSize: 14, fontWeight: "700", color: colors.textPrimary },
  contactNameSelected: { color: colors.goldLight },
  contactKey: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: colors.navyLight,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  roleBadgeSelected: { borderColor: colors.gold, backgroundColor: "rgba(217,154,38,0.15)" },
  roleBadgeText: { fontSize: 11, fontWeight: "700", color: colors.textSecondary },
  roleBadgeTextSelected: { color: colors.goldLight },

  separator: { height: 1, backgroundColor: colors.glassBorder, marginLeft: 56 },

  loadingCenter: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14, padding: 40 },
  loadingText: { color: colors.textSecondary, fontSize: 14 },
  emptyText: { color: colors.textSecondary, fontSize: 14, textAlign: "center" },
});
