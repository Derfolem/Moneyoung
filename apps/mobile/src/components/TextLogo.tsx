import { StyleSheet, Text, View } from "react-native";
import { colors } from "../theme/colors";

type Props = {
  size?: number;
  color?: string;
};

export function TextLogo({ size = 28, color = colors.textPrimary }: Props) {
  return (
    <View style={styles.container}>
      <Text style={[styles.text, { fontSize: size, color }]}>MoneYoung</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  text: {
    fontFamily: "JosefinSans_700Bold",
    letterSpacing: -0.3,
  },
});
