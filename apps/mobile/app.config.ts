import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "Moneyoung",
  slug: "moneyoung",
  scheme: "moneyoung",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.moneyoung.wallet"
  },
  android: {
    package: "com.moneyoung.wallet",
    permissions: ["CAMERA"]
  },
  web: {
    bundler: "metro"
  },
  plugins: ["expo-router", "expo-secure-store"],
  extra: {
    eas: {
      projectId: process.env.EAS_PROJECT_ID || "16888fa9-b2b9-4f32-9613-46bb7385b52e"
    }
  }
};

export default config;
