import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Button } from "../src/components/Button";
import { Screen } from "../src/components/Screen";
import { PageHeader } from "../src/components/PageHeader";
import { validateInviteCode, type InviteValidation } from "../src/services/moneyoung";
import { toast } from "../src/services/toast";
import { colors } from "../src/theme/colors";

export default function InvitePage() {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<InviteValidation | null>(null);

  async function handleValidate() {
    const trimmed = code.trim().toUpperCase();
    if (trimmed.length < 7) {
      toast.error("Codigo invalido", "O codigo deve ter 3 letras e 4 numeros (ex: ABC1234).");
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await validateInviteCode(trimmed);
      if (!res.valid) {
        toast.error("Codigo invalido", "Esse codigo nao existe ou a escola esta inativa.");
        return;
      }
      setResult(res);
    } catch (err) {
      toast.error("Erro", err instanceof Error ? err.message : "Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function handleContinue() {
    if (!result) return;
    router.push({
      pathname: "/register",
      params: {
        invite_code: code.trim().toUpperCase(),
        org_name: result.organization_name ?? "",
        code_type: result.code_type ?? "",
      },
    });
  }

  return (
    <Screen>
      <PageHeader title="Codigo Convite" />
      <View style={styles.container}>
        <Text style={styles.description}>
          Digite o codigo que voce recebeu da sua escola para se cadastrar no Moneyoung.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="AAA0000"
          placeholderTextColor={colors.textSecondary}
          value={code}
          onChangeText={(t) => setCode(t.toUpperCase().slice(0, 7))}
          autoCapitalize="characters"
          maxLength={7}
          autoFocus
        />

        {!result && (
          <Button
            title="Validar Codigo"
            onPress={handleValidate}
            loading={loading}
          />
        )}

        {result && (
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Escola encontrada!</Text>
            <Text style={styles.resultName}>{result.organization_name}</Text>
            <Text style={styles.resultType}>
              Tipo: {result.code_type === "student" ? "Aluno" : "Colaborador"}
            </Text>
            <Button title="Continuar com Google" onPress={handleContinue} />
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: 20, paddingTop: 12 },
  description: { color: colors.textSecondary, fontSize: 15, lineHeight: 22 },
  input: {
    backgroundColor: colors.glass,
    borderRadius: 16,
    minHeight: 56,
    paddingHorizontal: 18,
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: 4,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  resultCard: {
    backgroundColor: colors.glass,
    borderRadius: 20,
    padding: 20,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  resultLabel: { color: colors.gold, fontSize: 14, fontWeight: "700" },
  resultName: { color: colors.textPrimary, fontSize: 20, fontWeight: "900" },
  resultType: { color: colors.textSecondary, fontSize: 14, marginBottom: 8 },
});
