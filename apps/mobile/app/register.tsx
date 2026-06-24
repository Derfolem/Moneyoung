import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { Button } from "../src/components/Button";
import { Screen } from "../src/components/Screen";
import { PageHeader } from "../src/components/PageHeader";
import { registerWithInvite } from "../src/services/moneyoung";
import { signInWithGoogle } from "../src/services/auth";
import { isSupabaseConfigured, supabase } from "../src/services/supabase";
import { toast } from "../src/services/toast";
import { colors } from "../src/theme/colors";

function parseBRDate(dateStr: string): Date | null {
  const m = dateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  if (isNaN(d.getTime())) return null;
  if (d.getDate() !== Number(m[1]) || d.getMonth() !== Number(m[2]) - 1) return null;
  return d;
}

function calcAge(dateStr: string): number | null {
  const birth = parseBRDate(dateStr);
  if (!birth) return null;
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function toBRDate(raw: string, prev: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return digits.slice(0, 2) + "/" + digits.slice(2);
  return digits.slice(0, 2) + "/" + digits.slice(2, 4) + "/" + digits.slice(4);
}

function toISODate(brDate: string): string {
  const d = parseBRDate(brDate);
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function clearPendingInvite() {
  if (Platform.OS === "web") {
    try { localStorage.removeItem("myg_pending_invite"); } catch {}
  }
}

export default function RegisterPage() {
  const params = useLocalSearchParams<{ invite_code: string; org_name: string; code_type: string }>();
  const [loading, setLoading] = useState(false);
  const [authed, setAuthed] = useState(false);

  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [country, setCountry] = useState("Brasil");
  const [state, setState] = useState("");
  const [city, setCity] = useState("");
  const [sport, setSport] = useState("");
  const [about, setAbout] = useState("");
  const [hobby, setHobby] = useState("");

  const age = calcAge(birthDate);

  useEffect(() => {
    if (!isSupabaseConfigured || !params.invite_code) return;
    let cancelled = false;

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session && !cancelled) setAuthed(true);
    });

    async function pollSession() {
      for (let i = 0; i < 10; i++) {
        const { data } = await supabase.auth.getSession();
        if (cancelled) return;
        if (data.session) { setAuthed(true); return; }
        await new Promise(r => setTimeout(r, 500));
      }
    }
    pollSession();

    return () => { cancelled = true; listener.subscription.unsubscribe(); };
  }, [params.invite_code]);

  async function handleGoogleAuth() {
    setLoading(true);
    try {
      if (Platform.OS === "web") {
        localStorage.setItem("myg_pending_invite", JSON.stringify({
          invite_code: params.invite_code,
          org_name: params.org_name,
          code_type: params.code_type,
        }));
      }
      const ok = await signInWithGoogle();
      if (ok) setAuthed(true);
    } catch (err) {
      toast.error("Erro no login", err instanceof Error ? err.message : "Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  async function handleRegister() {
    if (!fullName.trim() || fullName.trim().length < 2) {
      toast.error("Nome invalido", "Informe seu nome completo.");
      return;
    }
    if (!birthDate || !parseBRDate(birthDate)) {
      toast.error("Data invalida", "Informe sua data de nascimento (DD/MM/AAAA).");
      return;
    }
    setLoading(true);
    try {
      await registerWithInvite({
        invite_code: params.invite_code,
        full_name: fullName.trim(),
        birth_date: toISODate(birthDate),
        country: country.trim() || undefined,
        state: state.trim() || undefined,
        city: city.trim() || undefined,
        sport: sport.trim() || undefined,
        about: about.trim() || undefined,
        hobby: hobby.trim() || undefined,
      });
      clearPendingInvite();
      router.replace("/pending-approval");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Tente novamente.";
      if (msg.includes("ja existe") || msg.includes("PROFILE_ALREADY_EXISTS") || msg.includes("PROFILE_EXISTS")) {
        clearPendingInvite();
        toast.error(
          "Conta ja existe",
          "Voce ja tem uma conta cadastrada. Faca login normalmente ou entre em contato com a escola caso tenha perdido o acesso."
        );
        router.replace("/login");
      } else {
        toast.error("Erro no cadastro", msg);
      }
    } finally {
      setLoading(false);
    }
  }

  if (!authed) {
    return (
      <Screen>
        <PageHeader title="Cadastro" />
        <View style={styles.container}>
          <View style={styles.orgBadge}>
            <Text style={styles.orgLabel}>Escola</Text>
            <Text style={styles.orgName}>{params.org_name}</Text>
            <Text style={styles.orgType}>
              Cadastro como: {params.code_type === "student" ? "Aluno" : "Colaborador"}
            </Text>
          </View>
          <Text style={styles.description}>
            Primeiro, faca login com sua conta Google para continuar o cadastro.
          </Text>
          <Button title="Entrar com Google" onPress={handleGoogleAuth} loading={loading} />
          <Button title="Voltar" tone="secondary" onPress={() => { clearPendingInvite(); router.replace("/login"); }} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen scroll>
      <PageHeader title="Complete seu Cadastro" />
      <View style={styles.container}>
        <View style={styles.orgBadge}>
          <Text style={styles.orgLabel}>{params.org_name}</Text>
          <Text style={styles.orgType}>
            {params.code_type === "student" ? "Aluno" : "Colaborador"}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Nome completo *</Text>
          <TextInput style={styles.input} value={fullName} onChangeText={setFullName}
            placeholder="Seu nome completo" placeholderTextColor={colors.textSecondary} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Data de nascimento *</Text>
          <TextInput style={styles.input} value={birthDate}
            onChangeText={(t) => setBirthDate(toBRDate(t, birthDate))}
            placeholder="DD/MM/AAAA" placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad" maxLength={10} />
          {age !== null && <Text style={styles.ageText}>{age} anos</Text>}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Pais</Text>
          <TextInput style={styles.input} value={country} onChangeText={setCountry}
            placeholder="Brasil" placeholderTextColor={colors.textSecondary} />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, { flex: 1 }]}>
            <Text style={styles.label}>Estado</Text>
            <TextInput style={styles.input} value={state} onChangeText={setState}
              placeholder="SP" placeholderTextColor={colors.textSecondary} />
          </View>
          <View style={[styles.field, { flex: 2 }]}>
            <Text style={styles.label}>Cidade</Text>
            <TextInput style={styles.input} value={city} onChangeText={setCity}
              placeholder="Sao Paulo" placeholderTextColor={colors.textSecondary} />
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Esporte favorito</Text>
          <TextInput style={styles.input} value={sport} onChangeText={setSport}
            placeholder="Futebol" placeholderTextColor={colors.textSecondary} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Hobby</Text>
          <TextInput style={styles.input} value={hobby} onChangeText={setHobby}
            placeholder="Jogos, musica..." placeholderTextColor={colors.textSecondary} />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Sobre voce</Text>
          <TextInput style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
            value={about} onChangeText={(t) => setAbout(t.slice(0, 200))}
            placeholder="Conte um pouco sobre voce (max 200 caracteres)"
            placeholderTextColor={colors.textSecondary}
            multiline maxLength={200} />
          <Text style={styles.counter}>{about.length}/200</Text>
        </View>

        <Button title="Criar Conta" onPress={handleRegister} loading={loading} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16, paddingBottom: 40 },
  description: { color: colors.textSecondary, fontSize: 15, lineHeight: 22 },
  orgBadge: {
    backgroundColor: colors.glass,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    gap: 4,
  },
  orgLabel: { color: colors.gold, fontSize: 12, fontWeight: "700", textTransform: "uppercase" },
  orgName: { color: colors.textPrimary, fontSize: 18, fontWeight: "900" },
  orgType: { color: colors.textSecondary, fontSize: 13 },
  field: { gap: 4 },
  label: { color: colors.textSecondary, fontSize: 13, fontWeight: "600" },
  input: {
    backgroundColor: colors.glass,
    borderRadius: 14,
    minHeight: 48,
    paddingHorizontal: 14,
    color: colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  row: { flexDirection: "row", gap: 12 },
  ageText: { color: colors.gold, fontSize: 13, fontWeight: "700" },
  counter: { color: colors.textSecondary, fontSize: 11, textAlign: "right" },
});
