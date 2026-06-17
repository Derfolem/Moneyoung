import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "YoungCoin",
  slug: "youngcoin",
  scheme: "youngcoin",
  version: "0.1.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.youngcoin.wallet"
  },
  android: {
    package: "com.youngcoin.wallet",
    permissions: ["CAMERA"]
  },
  web: {
    bundler: "metro"
  },
  plugins: ["expo-router", "expo-secure-store"],
  extra: {
    eas: {
      projectId: process.env.EAS_PROJECT_ID
    }
  }
};

export default config;
