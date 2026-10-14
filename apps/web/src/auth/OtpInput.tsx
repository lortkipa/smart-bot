import { type Ref, useEffect, useImperativeHandle, useRef } from "react";

export interface OtpInputHandle {
  focus(): void;
}

interface OtpInputProps {
  /** One entry per box, "" when empty. */
  value: string[];
  onChange(value: string[]): void;
  disabled?: boolean;
  invalid?: boolean;
  /** Increment to play the shake animation. */
  shake?: number;
  ref?: Ref<OtpInputHandle>;
}

/** One box per digit. Typing or pasting several digits fills forward from the focused box. */
export function OtpInput({ value, onChange, disabled, invalid, shake = 0, ref }: OtpInputProps) {
  const groupRef = useRef<HTMLDivElement>(null);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  useImperativeHandle(ref, () => ({ focus: () => boxes.current[0]?.focus() }), []);

  useEffect(() => {
    const group = groupRef.current;
    if (!shake || !group) return;
    // Restart the animation even if the previous shake hasn't finished.
    group.classList.remove("shake");
    void group.offsetWidth;
    group.classList.add("shake");
  }, [shake]);

  const fillFrom = (index: number, digits: string) => {
    const next = [...value];
    let i = index;
    for (const d of digits) {
      if (i >= next.length) break;
      next[i++] = d;
    }
    boxes.current[Math.min(i, next.length - 1)]?.focus();
    onChange(next);
  };

  const clearAt = (index: number) => {
    const next = [...value];
    next[index] = "";
    onChange(next);
  };

  return (
    <div className="otp" ref={groupRef} data-state={invalid ? "error" : undefined}>
      {value.map((digit, i) => (
        <input
          // biome-ignore lint/suspicious/noArrayIndexKey: boxes are positional and never reorder
          key={i}
          ref={(el) => {
            boxes.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1}`}
          value={digit}
          disabled={disabled}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, "");
            // The box already holds a digit, so a keystroke arrives as "<old><new>": keep the new one.
            if (digits)
              fillFrom(i, digit && digits.length > 1 && digits.startsWith(digit) ? digits.slice(1) : digits);
            else clearAt(i);
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace" && !digit && i > 0) {
              e.preventDefault();
              clearAt(i - 1);
              boxes.current[i - 1]?.focus();
            } else if (e.key === "ArrowLeft" && i > 0) {
              e.preventDefault();
              boxes.current[i - 1]?.focus();
            } else if (e.key === "ArrowRight" && i < value.length - 1) {
              e.preventDefault();
              boxes.current[i + 1]?.focus();
            }
          }}
          onFocus={(e) => e.target.select()}
          onPaste={(e) => {
            const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, value.length);
            if (!digits) return;
            e.preventDefault();
            fillFrom(i, digits);
          }}
        />
      ))}
    </div>
  );
}
