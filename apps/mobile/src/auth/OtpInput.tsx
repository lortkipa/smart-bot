import { CODE_LENGTH } from "@smart-bot/shared";
import { type Ref, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, TextInput, View } from "react-native";
import { FocusRing } from "../components/FocusRing";
import { fonts, radius, useTheme } from "../theme";

export interface OtpInputHandle {
  focus(): void;
}

interface OtpInputProps {
  /** Digits entered so far. */
  value: string;
  onChange(value: string): void;
  /** Ignores input but keeps focus (and the keyboard) while a code is being checked. */
  busy?: boolean;
  /** Not editable at all. */
  disabled?: boolean;
  invalid?: boolean;
  /** Increment to play the shake animation. */
  shake?: number;
  ref?: Ref<OtpInputHandle>;
}

/**
 * Six boxes drawn over one invisible TextInput, so typing, paste and the OS one-time-code
 * autofill all go through a single native field.
 */
export function OtpInput({ value, onChange, busy, disabled, invalid, shake = 0, ref }: OtpInputProps) {
  const { colors, compact } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const offset = useRef(new Animated.Value(0)).current;

  useImperativeHandle(ref, () => ({ focus: () => inputRef.current?.focus() }), []);

  useEffect(() => {
    if (!shake) return;
    const step = (toValue: number) =>
      Animated.timing(offset, {
        toValue,
        duration: 72,
        easing: Easing.bezier(0.36, 0.07, 0.19, 0.97),
        useNativeDriver: true,
      });
    Animated.sequence([step(-5), step(5), step(-5), step(5), step(0)]).start();
  }, [shake, offset]);

  const active = focused && !busy && !disabled ? Math.min(value.length, CODE_LENGTH - 1) : -1;

  return (
    <Animated.View style={[styles.row, { gap: compact ? 6 : 8, transform: [{ translateX: offset }] }]}>
      {Array.from({ length: CODE_LENGTH }, (_, i) => (
        <FocusRing
          // biome-ignore lint/suspicious/noArrayIndexKey: boxes are positional and never reorder
          key={i}
          style={styles.cell}
          color={i === active ? (invalid ? colors.dangerRing : colors.ring) : undefined}
        >
          <View
            style={[
              styles.box,
              {
                height: compact ? 50 : 54,
                backgroundColor: colors.bg,
                borderColor: invalid ? colors.danger : i === active ? colors.ringSolid : colors.border,
                opacity: busy || disabled ? 0.45 : 1,
              },
            ]}
          >
            <Text style={[styles.digit, { color: colors.fg, fontSize: compact ? 20 : 22 }]}>
              {value[i] ?? ""}
            </Text>
          </View>
        </FocusRing>
      ))}

      <TextInput
        ref={inputRef}
        style={styles.input}
        value={value}
        onChangeText={(text) => {
          if (!busy) onChange(text.replace(/\D/g, "").slice(0, CODE_LENGTH));
        }}
        editable={!disabled}
        maxLength={CODE_LENGTH}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        caretHidden
        accessibilityLabel="Verification code"
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  cell: { flex: 1 },
  box: { borderWidth: 1, borderRadius: radius, alignItems: "center", justifyContent: "center" },
  digit: { fontFamily: fonts.medium, fontVariant: ["tabular-nums"] },
  // Covers the boxes so a tap anywhere focuses it; invisible but still interactive.
  input: { position: "absolute", top: 0, right: 0, bottom: 0, left: 0, opacity: 0.011, color: "transparent" },
});
