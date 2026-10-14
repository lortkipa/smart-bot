import { useColorScheme, useWindowDimensions } from "react-native";

// Same tokens as the web app (apps/web/src/styles.css). Signal Blue only for the logo dot,
// primary actions and focus rings.
const light = {
  bg: "#FFFFFF",
  fg: "#0B0C0F",
  muted: "#626874",
  border: "#DCDFE5",
  borderStrong: "#C3C8D1",
  primaryBg: "#2F7BFF",
  primaryFg: "#FFFFFF",
  primaryPressed: "#1F68E8",
  secondaryPressed: "#F4F5F7",
  dot: "#2F7BFF",
  ring: "rgba(47, 123, 255, 0.32)",
  ringSolid: "#2F7BFF",
  danger: "#CF2F36",
  dangerRing: "rgba(207, 47, 54, 0.22)",
};

const dark: typeof light = {
  bg: "#000000",
  fg: "#EEF0F3",
  muted: "#8F95A1",
  border: "#26282E",
  borderStrong: "#3B3E47",
  primaryBg: "#2F7BFF",
  primaryFg: "#FFFFFF",
  primaryPressed: "#4D8FFF",
  secondaryPressed: "#0F1013",
  dot: "#4D8FFF",
  ring: "rgba(77, 143, 255, 0.42)",
  ringSolid: "#4D8FFF",
  danger: "#FF6B70",
  dangerRing: "rgba(255, 107, 112, 0.28)",
};

export type Colors = typeof light;

/** Loaded in App.tsx with useFonts. One family per weight, which works the same on iOS and Android. */
export const fonts = {
  regular: "InstrumentSans_400Regular",
  medium: "InstrumentSans_500Medium",
  semibold: "InstrumentSans_600SemiBold",
};

export const radius = 10;
export const controlHeight = 46;
/** Width of the focus ring drawn outside a control's border. */
export const ringWidth = 3;

export function useTheme() {
  const scheme = useColorScheme();
  const { width, height } = useWindowDimensions();
  return {
    colors: scheme === "dark" ? dark : light,
    dark: scheme === "dark",
    /** Phone-sized screen; the design tightens spacing and type below 420px. */
    compact: width <= 420,
    width,
    height,
  };
}
