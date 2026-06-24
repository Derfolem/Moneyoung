import { ReactElement, ReactNode } from "react";
import { RefreshControlProps, SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { AmbientOrbs, GoldDust } from "./GoldDust";
import { colors } from "../theme/colors";

type Props = {
  children: ReactNode;
  scroll?: boolean;
  refreshControl?: ReactElement<RefreshControlProps>;
  darkMode?: boolean;
  statusBarStyle?: "light" | "dark";
  dust?: boolean;
};

export function Screen({ children, scroll = true, refreshControl, statusBarStyle, dust }: Props) {
  const barStyle = statusBarStyle ?? "light";
  const content = <View style={styles.content}>{children}</View>;
  return (
    <SafeAreaView style={styles.root}>
      <StatusBar style={barStyle} />
      <AmbientOrbs />
      {dust && <GoldDust />}
      {scroll ? <ScrollView keyboardShouldPersistTaps="handled" refreshControl={refreshControl}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.navyDeep },
  content: { flex: 1, padding: 24, gap: 20 },
});
