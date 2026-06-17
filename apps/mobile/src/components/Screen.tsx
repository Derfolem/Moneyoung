import { ReactElement, ReactNode } from "react";
import { RefreshControlProps, SafeAreaView, ScrollView, StyleSheet, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { colors } from "../theme/colors";

type Props = {
  children: ReactNode;
  scroll?: boolean;
  refreshControl?: ReactElement<RefreshControlProps>;
  darkMode?: boolean;
  statusBarStyle?: "light" | "dark";
};

export function Screen({ children, scroll = true, refreshControl, darkMode, statusBarStyle }: Props) {
  const barStyle = statusBarStyle ?? (darkMode ? "light" : "dark");
  const bg = darkMode ? colors.navyDeep : colors.background;
  const content = <View style={styles.content}>{children}</View>;
  return (
    <SafeAreaView style={[styles.root, { backgroundColor: bg }]}>
      <StatusBar style={barStyle} />
      {scroll ? <ScrollView keyboardShouldPersistTaps="handled" refreshControl={refreshControl}>{content}</ScrollView> : content}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flex: 1, padding: 24, gap: 20 },
});
