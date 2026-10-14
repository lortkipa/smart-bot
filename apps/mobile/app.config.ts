import type { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "Smart Bot",
  slug: "smart-bot",
  scheme: "smartbot",
  version: "0.1.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "automatic",
  ios: {
    bundleIdentifier: "org.smartbot.app",
    supportsTablet: true,
    infoPlist: {
      // Lets builds reach the API on the dev machine over plain HTTP (localhost).
      NSAppTransportSecurity: { NSAllowsLocalNetworking: true },
    },
  },
  android: {
    package: "org.smartbot.app",
    adaptiveIcon: {
      backgroundColor: "#000000",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
  },
  web: {
    favicon: "./assets/favicon.png",
  },
  plugins: [
    [
      "expo-build-properties",
      {
        // Release builds talk to the local prod stack over plain HTTP (http://10.0.2.2:8080).
        android: { usesCleartextTraffic: true },
      },
    ],
  ],
});
