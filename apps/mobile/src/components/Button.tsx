import type { ReactNode } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";
import { controlHeight, fonts, radius, useTheme } from "../theme";

interface ButtonProps {
  variant: "primary" | "secondary" | "text";
  children: ReactNode;
  onPress(): void;
  icon?: ReactNode;
  loading?: boolean;
  disabled?: boolean;
}

export function Button({ variant, children, onPress, icon, loading = false, disabled = false }: ButtonProps) {
  const { colors } = useTheme();
  const inactive = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => {
        const down = pressed && !inactive;
        if (variant === "primary")
          return [
            styles.base,
            { backgroundColor: down ? colors.primaryPressed : colors.primaryBg },
            disabled && !loading && styles.dimmed,
          ];
        if (variant === "secondary")
          return [
            styles.base,
            {
              backgroundColor: down ? colors.secondaryPressed : colors.bg,
              borderColor: down ? colors.borderStrong : colors.border,
            },
          ];
        return [styles.base, styles.text, disabled && styles.textDisabled];
      }}
    >
      {({ pressed }) => {
        const color =
          variant === "primary"
            ? colors.primaryFg
            : variant === "secondary" || (pressed && !inactive)
              ? colors.fg
              : colors.muted;
        return (
          <>
            <View style={[styles.content, loading && styles.hidden]}>
              {icon}
              <Text style={[styles.label, { color }]}>{children}</Text>
            </View>
            {loading && <ActivityIndicator style={StyleSheet.absoluteFill} color={color} />}
          </>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: controlHeight,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: radius,
    borderWidth: 1,
    borderColor: "transparent",
  },
  text: { height: 36, alignSelf: "center", paddingHorizontal: 8 },
  textDisabled: { opacity: 0.55 },
  dimmed: { opacity: 0.4 },
  content: { flexDirection: "row", alignItems: "center", gap: 10 },
  hidden: { opacity: 0 },
  label: { fontFamily: fonts.medium, fontSize: 15 },
});
