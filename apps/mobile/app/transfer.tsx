import { router } from "expo-router";
import { useState } from "react";
import { Alert, StyleSheet, Text, TextInput, View } from "react-native";
import { Button } from "../src/components/Button";
import { PageHeader } from "../src/components/PageHeader";
import { Screen } from "../src/components/Screen";
import { parseYoungCoinAmount } from "../src/services/youngcoin";
import { colors } from "../src/theme/colors";

export default function Transfer() {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");

  function goToConfirm() {
    const parsedAmount = parseYoungCoinAmount(amount);
    if (!to.trim()) {
      Alert.alert("Chave obrigatoria", "Informe a chave YoungCoin de destino.");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Valor invalido", "Informe um valor maior que zero.");
      return;
    }

    router.push({
      pathname: "/transfer-confirm",
      params: { to: to.trim(), amount, description },
    });
  }

  return (
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
        placeholderTextColor={colors.muted}
      />

      <View style={styles.fields}>
        <Text style={styles.label}>Chave YoungCoin</Text>
        <TextInput
          style={styles.input}
          placeholder="@chaveyoung"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          value={to}
          onChangeText={setTo}
        />

        <Text style={styles.label}>Descricao</Text>
        <TextInput
          style={styles.input}
          placeholder="Opcional"
          placeholderTextColor={colors.muted}
          value={description}
          onChangeText={setDescription}
        />
      </View>

      <Button title="Transferir" onPress={goToConfirm} disabled={!to.trim() || !amount.trim()} />
    </Screen>
  );
}

const styles = StyleSheet.create({
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
    color: colors.ink,
  },
  amountSuffix: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.muted,
  },
  hiddenInput: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    textAlign: "center",
    color: colors.ink,
  },
  fields: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    color: colors.muted,
    fontWeight: "600",
    marginTop: 8,
  },
  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.ink,
  },
});
