import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TextInput, View } from "react-native";
import { Button } from "../src/components/Button";
import { PageHeader } from "../src/components/PageHeader";
import { Screen } from "../src/components/Screen";
import { BottomNav } from "../src/components/BottomNav";
import { parseAmount } from "../src/services/moneyoung";
import { toast } from "../src/services/toast";
import { colors } from "../src/theme/colors";

export default function Transfer() {
  const params = useLocalSearchParams<{ to?: string }>();
  const [to, setTo] = useState(params.to ?? "");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

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

  return (
    <View style={styles.root}>
      <Screen>
        <PageHeader title="Transferir" />

        <View style={styles.amountArea}>
          <Text style={styles.amountDisplay}>{amount || "0"}</Text>
          <Text style={styles.amountSuffix}>YC</Text>
        </View>

        <TextInput
          style={styles.hiddenInput}
          keyboardType="decimal-pad"
          value={amount}
          onChangeText={setAmount}
          placeholder="0,00"
          placeholderTextColor={colors.textSecondary}
        />

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

        <Button title="Transferir" onPress={goToConfirm} disabled={!to.trim() || !amount.trim()} />
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
    justifyContent: "center",
    paddingVertical: 20,
    gap: 8,
  },
  amountDisplay: {
    fontSize: 48,
    fontWeight: "900",
    color: colors.gold,
    textShadowColor: colors.glowGold,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 14,
  },
  amountSuffix: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textSecondary,
  },
  hiddenInput: {
    backgroundColor: colors.glass,
    borderRadius: 16,
    padding: 16,
    fontSize: 18,
    textAlign: "center",
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  fields: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "600",
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.glass,
    borderRadius: 16,
    padding: 16,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
});
