import {
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
  useFonts,
} from "@expo-google-fonts/instrument-sans";
import { StatusBar } from "expo-status-bar";
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import { SignIn } from "./src/auth/SignIn";
import { Lockup } from "./src/components/Logo";
import { useTheme } from "./src/theme";

export default function App() {
  const [fontsLoaded] = useFonts({
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
  });
  const { colors, compact, height } = useTheme();

  // Bundled with the app, so this is a single frame or two.
  if (!fontsLoaded) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={[styles.fill, { backgroundColor: colors.bg }]}>
        <KeyboardAvoidingView style={styles.fill} behavior="padding">
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={[styles.header, { paddingHorizontal: compact ? 0 : 8 }]}>
              <Lockup height={22} />
            </View>
            <View
              style={[
                styles.main,
                { paddingTop: compact ? 8 : 24, paddingBottom: height * (compact ? 0.08 : 0.12) },
              ]}
            >
              <View style={styles.panel}>
                <SignIn />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 16 },
  header: { paddingVertical: 22, alignItems: "flex-start" },
  main: { flex: 1, alignItems: "center", justifyContent: "center" },
  panel: { width: "100%", maxWidth: 360 },
});
