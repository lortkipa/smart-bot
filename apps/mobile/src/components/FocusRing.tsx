import type { ReactNode } from "react";
import { StyleSheet, View, type ViewStyle } from "react-native";
import { radius, ringWidth } from "../theme";

/**
 * Draws the design's 3px focus halo outside a control without shifting layout
 * (CSS box-shadow has no cross-platform equivalent in React Native).
 */
export function FocusRing({
  color,
  children,
  style,
}: {
  color?: string;
  children: ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[styles.ring, { borderColor: color ?? "transparent" }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  ring: {
    margin: -ringWidth,
    borderWidth: ringWidth,
    borderRadius: radius + ringWidth,
  },
});
