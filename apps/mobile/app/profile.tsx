import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { StateView } from "../src/components/StateView";
import { TextLogo } from "../src/components/TextLogo";
import { BottomNav } from "../src/components/BottomNav";
import { GlassCard } from "../src/components/GlassCard";
import { AmbientOrbs } from "../src/components/GoldDust";
import { signOut } from "../src/services/auth";
import { requestCancellation } from "../src/services/moneyoung";
import { supabase } from "../src/services/supabase";
import { toast } from "../src/services/toast";
import { colors } from "../src/theme/colors";

type InfoItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
};

type SchoolInfo = {
  organization_name: string | null;
  member_role: string | null;
};

type ProfileData = {
  display_name: string | null;
  email: string | null;
  young_key: string | null;
  account_type: string | null;
  role: string | null;
  status: string | null;
  full_name: string | null;
  birth_date: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  sport: string | null;
  hobby: string | null;
  about: string | null;
  cancellation_requested_at: string | null;
  created_at: string | null;
};

function formatDateBR(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const d = new Date(dateStr + (dateStr.length === 10 ? "T12:00:00" : ""));
  if (isNaN(d.getTime())) return dateStr;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = String(d.getFullYear()).slice(-2);
  return `${day}/${month}/${year}`;
}

const roleLabels: Record<string, string> = {
  student: "Aluno",
  teacher: "Professor",
  staff: "Funcionario",
  admin: "Diretor",
};

const accountTypeLabels: Record<string, string> = {
  personal: "Pessoal (Aluno)",
  business: "Escola",
  sub_business: "Colaborador",
};

export default function Profile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const uid = session?.session?.user.id;
      if (!uid) { router.replace("/login"); return; }

      const { data: prof } = await supabase
        .from("profiles")
        .select("display_name,email,young_key,account_type,role,status,full_name,birth_date,country,state,city,sport,hobby,about,cancellation_requested_at,created_at")
        .eq("id", uid)
        .maybeSingle();
      if (prof) setProfile(prof as ProfileData);

      const { data: membership } = await supabase
        .from("organization_members")
        .select("member_role,organization_id")
        .eq("profile_id", uid)
        .eq("status", "active")
        .maybeSingle();
      if (membership) {
        const { data: org } = await supabase
          .from("organizations")
          .select("name")
          .eq("id", membership.organization_id)
          .maybeSingle();
        setSchool({
          organization_name: org?.name ?? null,
          member_role: membership.member_role,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel carregar seu perfil.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignOut() {
    try {
      setSigningOut(true);
      await signOut();
      router.replace("/login");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Nao foi possivel sair.");
    } finally {
      setSigningOut(false);
    }
  }

  async function handleCancelAccount() {
    const doCancel = async () => {
      setCancelling(true);
      try {
        await requestCancellation();
        toast.success("Solicitacao enviada", "Seu pedido de cancelamento foi enviado para aprovacao do banco.");
        await loadProfile();
      } catch (err) {
        toast.error("Erro", err instanceof Error ? err.message : "Tente novamente.");
      } finally {
        setCancelling(false);
      }
    };

    if (Platform.OS === "web") {
      if (confirm("Deseja realmente solicitar o cancelamento da sua conta? Esta acao precisa de aprovacao do banco.")) {
        doCancel();
      }
    } else {
      Alert.alert(
        "Cancelar Conta",
        "Deseja realmente solicitar o cancelamento da sua conta? Esta acao precisa de aprovacao do banco.",
        [
          { text: "Nao", style: "cancel" },
          { text: "Sim, cancelar", style: "destructive", onPress: doCancel },
        ]
      );
    }
  }

  const isStaff = profile?.account_type === "sub_business";
  const hasPendingCancellation = !!profile?.cancellation_requested_at;

  if (loading) {
    return (
      <View style={styles.root}>
        <View style={styles.body}><StateView loading title="Carregando perfil" /></View>
        <BottomNav staff={isStaff} />
      </View>
    );
  }
  if (error && !profile) {
    return (
      <View style={styles.root}>
        <View style={styles.body}><StateView title="Perfil indisponivel" message={error} /></View>
        <BottomNav />
      </View>
    );
  }

  const name = profile?.full_name ?? profile?.display_name ?? "Usuario MoneYoung";
  const initial = name.charAt(0).toUpperCase();

  const statusLabel: Record<string, string> = {
    active: "Ativo",
    pending: "Pendente",
    blocked: "Bloqueado",
    deleted: "Cancelado",
  };

  const items: InfoItem[] = [
    { icon: "key-outline", label: "Young Key", value: profile?.young_key ?? "" },
    { icon: "mail-outline", label: "Email", value: profile?.email ?? "" },
    { icon: "person-outline", label: "Tipo de conta", value: accountTypeLabels[profile?.account_type ?? ""] ?? profile?.account_type ?? "" },
    { icon: "shield-checkmark-outline", label: "Status", value: statusLabel[profile?.status ?? ""] ?? profile?.status ?? "" },
  ];

  if (profile?.birth_date) {
    items.push({ icon: "calendar-outline", label: "Data de nascimento", value: formatDateBR(profile.birth_date) });
  }
  if (profile?.city || profile?.state || profile?.country) {
    const location = [profile.city, profile.state, profile.country].filter(Boolean).join(", ");
    items.push({ icon: "location-outline", label: "Localizacao", value: location });
  }
  if (profile?.sport) {
    items.push({ icon: "football-outline", label: "Esporte", value: profile.sport });
  }
  if (profile?.hobby) {
    items.push({ icon: "game-controller-outline", label: "Hobby", value: profile.hobby });
  }
  if (profile?.created_at) {
    items.push({ icon: "time-outline", label: "Conta aberta em", value: formatDateBR(profile.created_at) });
  }

  return (
    <View style={styles.root}>
      <StatusBar style="light" />
      <AmbientOrbs />
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerBar}>
          <TextLogo size={20} />
        </View>

        <View style={styles.profileCard}>
          <View style={styles.avatarGlow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          </View>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.key}>{profile?.young_key}</Text>
        </View>

        {school?.organization_name && (
          <GlassCard style={styles.schoolBadge}>
            <View style={styles.schoolRow}>
              <Ionicons name="school-outline" size={20} color={colors.gold} />
              <View style={{ flex: 1 }}>
                <Text style={styles.schoolName}>{school.organization_name}</Text>
                <Text style={styles.schoolRole}>
                  {roleLabels[school.member_role ?? ""] ?? school.member_role}
                </Text>
              </View>
            </View>
          </GlassCard>
        )}

        <GlassCard style={styles.listCard}>
          {items.map((item, idx) => (
            <View key={item.label} style={[styles.row, idx === items.length - 1 && styles.rowLast]}>
              <View style={styles.iconCircle}>
                <Ionicons name={item.icon} size={20} color={colors.gold} />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowValue}>{item.value}</Text>
              </View>
            </View>
          ))}
        </GlassCard>

        {profile?.about ? (
          <GlassCard style={styles.aboutSection}>
            <Text style={styles.aboutLabel}>Sobre</Text>
            <Text style={styles.aboutText}>{profile.about}</Text>
          </GlassCard>
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {hasPendingCancellation && (
          <View style={styles.cancelBanner}>
            <Ionicons name="time-outline" size={18} color={colors.gold} />
            <Text style={styles.cancelBannerText}>
              Cancelamento solicitado. Aguardando aprovacao do banco.
            </Text>
          </View>
        )}

        {!hasPendingCancellation && (
          <Pressable style={styles.cancelBtn} onPress={handleCancelAccount} disabled={cancelling}>
            <Ionicons name="close-circle-outline" size={20} color={colors.danger} />
            <Text style={styles.cancelBtnText}>
              {cancelling ? "Solicitando..." : "Cancelar minha conta"}
            </Text>
          </Pressable>
        )}

        <Pressable style={styles.signOut} onPress={handleSignOut} disabled={signingOut}>
          <Ionicons name="log-out-outline" size={20} color={colors.danger} />
          <Text style={styles.signOutText}>{signingOut ? "Saindo..." : "Sair da conta"}</Text>
        </Pressable>
      </ScrollView>
      <BottomNav staff={isStaff} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navyDeep },
  body: { flex: 1, justifyContent: "center", padding: 24 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 20 },

  headerBar: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    alignItems: "center",
  },

  profileCard: {
    alignItems: "center",
    paddingVertical: 20,
    paddingHorizontal: 24,
    gap: 8,
  },
  avatarGlow: {
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    borderRadius: 52,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.gold,
    borderWidth: 3,
    borderColor: colors.goldLight,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: colors.navyDeep, fontSize: 36, fontWeight: "900" },
  name: { color: colors.textPrimary, fontSize: 24, fontWeight: "900" },
  key: {
    color: colors.gold, fontSize: 14, fontWeight: "600",
    textShadowColor: colors.glowGoldSoft, textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },

  schoolBadge: {
    marginHorizontal: 24,
    marginBottom: 12,
    padding: 0,
  },
  schoolRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  schoolName: { color: colors.textPrimary, fontSize: 16, fontWeight: "800" },
  schoolRole: { color: colors.gold, fontSize: 13, fontWeight: "600" },

  listCard: {
    marginHorizontal: 24,
    padding: 0,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.glowGoldSoft,
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { flex: 1, gap: 2 },
  rowLabel: { fontSize: 13, color: colors.textSecondary },
  rowValue: { fontSize: 16, fontWeight: "700", color: colors.textPrimary },

  aboutSection: {
    marginHorizontal: 24,
    gap: 4,
  },
  aboutLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: "600" },
  aboutText: { fontSize: 15, color: colors.textPrimary, lineHeight: 22 },

  error: { color: colors.danger, fontWeight: "700", textAlign: "center", paddingHorizontal: 24, marginTop: 12 },

  cancelBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginHorizontal: 24,
    marginTop: 20,
    backgroundColor: colors.glowGoldSoft,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  cancelBannerText: { color: colors.gold, fontSize: 14, fontWeight: "600", flex: 1 },

  cancelBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    marginTop: 20,
    marginHorizontal: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.glowDanger,
    backgroundColor: colors.glass,
  },
  cancelBtnText: { color: colors.danger, fontWeight: "700", fontSize: 15 },

  signOut: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    marginTop: 12,
  },
  signOutText: { color: colors.danger, fontWeight: "700", fontSize: 16 },
});
