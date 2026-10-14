import { StatusBar } from "expo-status-bar";
import { Image, Platform, StyleSheet, Text, useColorScheme, View } from "react-native";
import { baseUrl } from "./src/lib/api";
import { useServerStatus } from "./src/lib/useServerStatus";

const palette = {
  light: { bg: "#FFFFFF", fg: "#000000", muted: "#6B6B6B", line: "#E6E6E6", signal: "#2F7BFF" },
  dark: { bg: "#000000", fg: "#FFFFFF", muted: "#9A9A9A", line: "#262626", signal: "#4D8FFF" },
};
const BAD = "#D14343";

export default function App() {
  const colors = palette[useColorScheme() === "dark" ? "dark" : "light"];
  const { health, error, realtime } = useServerStatus();

  const rows: { label: string; value: string; ok?: boolean }[] = [
    { label: "Client", value: `mobile · ${Platform.OS}` },
    { label: "Server", value: baseUrl },
    {
      label: "API",
      value: health ? `${health.status} · v${health.version}` : (error ?? "checking…"),
      ok: health?.status === "ok",
    },
    { label: "Database", value: health?.database ?? "…", ok: health?.database === "ok" },
    { label: "Realtime", value: realtime, ok: realtime === "open" },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg }]}>
      <Image source={require("./assets/icon.png")} style={styles.icon} />
      <Text style={[styles.title, { color: colors.fg }]}>Smart Bot</Text>

      <View style={[styles.table, { borderColor: colors.line }]}>
        {rows.map((row) => (
          <View key={row.label} style={[styles.row, { borderColor: colors.line }]}>
            <Text style={{ color: colors.muted }}>{row.label}</Text>
            <View style={styles.value}>
              {row.ok !== undefined && (
                <View style={[styles.dot, { backgroundColor: row.ok ? colors.signal : BAD }]} />
              )}
              <Text style={{ color: colors.fg }} numberOfLines={1}>
                {row.value}
              </Text>
            </View>
          </View>
        ))}
      </View>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
  icon: { width: 88, height: 88, borderRadius: 20 },
  title: { fontSize: 24, fontWeight: "600", marginBottom: 24 },
  table: { alignSelf: "stretch", maxWidth: 420, borderTopWidth: StyleSheet.hairlineWidth },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  value: { flexDirection: "row", alignItems: "center", gap: 8, flexShrink: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
});
