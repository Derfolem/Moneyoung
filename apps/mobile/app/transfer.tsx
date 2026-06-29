import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
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

        <View style={styles.shortcuts}>
          {["+10", "+50", "+100", "+200"].map((item) => (
            <Pressable key={item} style={styles.shortcut} onPress={() => setAmount(item.replace("+", ""))}>
              <Text style={styles.shortcutText}>{item}</Text>
            </Pressable>
          ))}
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
    textAlign: "left",
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
    backgroundColor: colors.input,
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  shortcuts: {
    flexDirection: "row",
    gap: 10,
  },
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
