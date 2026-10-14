import { type Ref, useState } from "react";
import { StyleSheet, TextInput, type TextInputProps } from "react-native";
import { controlHeight, fonts, radius, useTheme } from "../theme";
import { FocusRing } from "./FocusRing";

export function TextField({
  invalid,
  onFocus,
  onBlur,
  style,
  ref,
  ...props
}: TextInputProps & { invalid?: boolean; ref?: Ref<TextInput> }) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <FocusRing color={focused ? (invalid ? colors.dangerRing : colors.ring) : undefined}>
      <TextInput
        ref={ref}
        {...props}
        placeholderTextColor={colors.muted}
        cursorColor={colors.ringSolid}
        selectionColor={colors.ring}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          {
            color: colors.fg,
            backgroundColor: colors.bg,
            borderColor: invalid ? colors.danger : focused ? colors.ringSolid : colors.border,
          },
          style,
        ]}
      />
    </FocusRing>
  );
}

const styles = StyleSheet.create({
  input: {
    height: controlHeight,
    paddingHorizontal: 14,
    paddingVertical: 0,
    fontFamily: fonts.regular,
    fontSize: 15,
    borderWidth: 1,
    borderRadius: radius,
  },
});
