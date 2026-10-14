import { CODE_LENGTH, EmailAddress, RESEND_CODE_SECONDS } from "@smart-bot/shared";
import { type ReactNode, useEffect, useRef, useState } from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Easing,
  StyleSheet,
  Text,
  type TextInput,
  View,
} from "react-native";
import { Button } from "../components/Button";
import { GoogleIcon } from "../components/GoogleIcon";
import { Mark } from "../components/Logo";
import { TextField } from "../components/TextField";
import { auth } from "../lib/auth";
import { fonts, useTheme } from "../theme";
import { OtpInput, type OtpInputHandle } from "./OtpInput";
import { formatSeconds, useCountdown } from "./useCountdown";

type Method = "email" | "google";

type Screen =
  | { step: "start"; prefill: string; focus: boolean }
  | { step: "code"; email: string }
  | { step: "name"; email: string; method: Method; prefill: string }
  | { step: "done"; email: string; name: string };

export function SignIn() {
  const [screen, setScreen] = useState<Screen>({ step: "start", prefill: "", focus: false });
  const goStart = (prefill: string) => setScreen({ step: "start", prefill, focus: true });

  switch (screen.step) {
    case "start":
      return (
        <StartStep
          key="start"
          prefill={screen.prefill}
          autoFocus={screen.focus}
          onEmail={(email) => setScreen({ step: "code", email })}
          onGoogle={({ email, name }) => setScreen({ step: "name", email, method: "google", prefill: name })}
        />
      );
    case "code":
      return (
        <CodeStep
          key="code"
          email={screen.email}
          onVerified={() => setScreen({ step: "name", email: screen.email, method: "email", prefill: "" })}
          onBack={() => goStart(screen.email)}
        />
      );
    case "name":
      return (
        <NameStep
          key="name"
          prefill={screen.prefill}
          onDone={(name) => setScreen({ step: "done", email: screen.email, name })}
          onBack={() => goStart(screen.method === "email" ? screen.email : "")}
        />
      );
    case "done":
      return <DoneStep key="done" {...screen} onSignOut={() => goStart("")} />;
  }
}

/* ---------- Step 1: choose a method ---------- */

function StartStep({
  prefill,
  autoFocus,
  onEmail,
  onGoogle,
}: {
  prefill: string;
  autoFocus: boolean;
  onEmail(email: string): void;
  onGoogle(account: { email: string; name: string }): void;
}) {
  const { colors } = useTheme();
  const [email, setEmail] = useState(prefill);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<Method>();
  const inputRef = useRef<TextInput>(null);

  const fail = (message: string) => {
    setError(message);
    inputRef.current?.focus();
  };

  const submit = async () => {
    if (loading) return;
    const value = email.trim().toLowerCase();
    if (!value) return fail("Enter your email address.");
    if (!EmailAddress.safeParse(value).success) return fail("Enter a valid email address.");
    setLoading("email");
    await auth.startEmail(value);
    onEmail(value);
  };

  return (
    <Step title="Sign in to Smart Bot">
      <View style={styles.stack}>
        <TextField
          ref={inputRef}
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setError("");
          }}
          invalid={!!error}
          placeholder="Email address"
          accessibilityLabel="Email address"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={autoFocus}
          selectTextOnFocus={!!prefill}
          returnKeyType="go"
          submitBehavior="submit"
          onSubmitEditing={submit}
        />
        {!!error && <ErrorText>{error}</ErrorText>}
        <Button variant="primary" loading={loading === "email"} disabled={!!loading} onPress={submit}>
          Continue with Email
        </Button>

        <View style={styles.divider} importantForAccessibility="no-hide-descendants">
          <View style={[styles.rule, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.muted }]}>or</Text>
          <View style={[styles.rule, { backgroundColor: colors.border }]} />
        </View>

        <Button
          variant="secondary"
          icon={<GoogleIcon />}
          loading={loading === "google"}
          disabled={!!loading}
          onPress={async () => {
            setLoading("google");
            onGoogle(await auth.signInWithGoogle());
          }}
        >
          Continue with Google
        </Button>
      </View>
    </Step>
  );
}

/* ---------- Step 2: verification code ---------- */

type CodeStatus = { text: string; tone?: "error"; busy?: boolean };

function CodeStep({ email, onVerified, onBack }: { email: string; onVerified(): void; onBack(): void }) {
  const { colors } = useTheme();
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<CodeStatus>({ text: "" });
  const [invalid, setInvalid] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [locked, setLocked] = useState(false);
  const [shake, setShake] = useState(0);
  const resend = useCountdown();
  const otpRef = useRef<OtpInputHandle>(null);

  const { start: startResendTimer } = resend;
  useEffect(() => {
    startResendTimer(RESEND_CODE_SECONDS);
    // After the step's enter animation, so the keyboard doesn't open mid-transition.
    const timer = setTimeout(() => otpRef.current?.focus(), 300);
    return () => clearTimeout(timer);
  }, [startResendTimer]);

  const verify = async (value: string) => {
    setVerifying(true);
    setStatus({ text: "Verifying", busy: true });
    const result = await auth.verifyCode(email, value);
    if (result.ok) {
      resend.stop();
      onVerified();
      return;
    }

    setInvalid(true);
    setShake((n) => n + 1);
    if (result.attemptsLeft <= 0) {
      resend.stop();
      setLocked(true);
      setStatus({ text: "Too many incorrect attempts.", tone: "error" });
      return;
    }
    setVerifying(false);
    setCode("");
    const left = result.attemptsLeft;
    setStatus({
      text: `Incorrect code. ${left} ${left === 1 ? "attempt" : "attempts"} left.`,
      tone: "error",
    });
  };

  return (
    <Step
      title="Check your email"
      sub={
        <>
          Enter the {CODE_LENGTH}-digit code sent to{" "}
          <Text style={{ color: colors.fg, fontFamily: fonts.medium }}>{email}</Text>
        </>
      }
    >
      <View style={styles.stack}>
        <OtpInput
          ref={otpRef}
          value={code}
          busy={verifying}
          disabled={locked}
          invalid={invalid}
          shake={shake}
          onChange={(next) => {
            setCode(next);
            if (!locked) setInvalid(false);
            if (next.length === CODE_LENGTH) void verify(next);
          }}
        />
        <View style={styles.codeMsg} accessibilityLiveRegion="polite">
          {status.busy && <ActivityIndicator size="small" color={colors.muted} style={styles.smallSpinner} />}
          <Text style={[styles.small, { color: status.tone === "error" ? colors.danger : colors.muted }]}>
            {status.text}
          </Text>
        </View>
      </View>

      <View style={styles.codeActions}>
        {!locked && (
          <Button
            variant="text"
            disabled={verifying || resend.left > 0}
            onPress={async () => {
              await auth.resendCode(email);
              setCode("");
              setInvalid(false);
              setStatus({ text: "" });
              resend.start(RESEND_CODE_SECONDS);
              otpRef.current?.focus();
            }}
          >
            {resend.left > 0 ? (
              <>
                Resend code in <Text style={styles.tnum}>{formatSeconds(resend.left)}</Text>
              </>
            ) : (
              "Resend code"
            )}
          </Button>
        )}
        <Button variant="text" onPress={onBack}>
          Try a different Email
        </Button>
      </View>
    </Step>
  );
}

/* ---------- Step 3: name ---------- */

function NameStep({
  prefill,
  onDone,
  onBack,
}: {
  prefill: string;
  onDone(name: string): void;
  onBack(): void;
}) {
  const [name, setName] = useState(prefill);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const submit = async () => {
    if (loading) return;
    const value = name.trim().replace(/\s+/g, " ");
    if (!value) {
      setError("Enter your name.");
      inputRef.current?.focus();
      return;
    }
    setLoading(true);
    await auth.completeProfile(value);
    onDone(value);
  };

  return (
    <Step title="What's your name?">
      <View style={styles.stack}>
        <TextField
          ref={inputRef}
          value={name}
          onChangeText={(text) => {
            setName(text);
            setError("");
          }}
          invalid={!!error}
          placeholder="Your name"
          accessibilityLabel="Full name"
          autoComplete="name"
          textContentType="name"
          autoCapitalize="words"
          autoFocus
          returnKeyType="done"
          submitBehavior="submit"
          onSubmitEditing={submit}
        />
        {!!error && <ErrorText>{error}</ErrorText>}
        <Button variant="primary" loading={loading} disabled={!name.trim()} onPress={submit}>
          Continue
        </Button>
      </View>

      <Button variant="text" onPress={onBack}>
        Try a different Email
      </Button>
    </Step>
  );
}

/* ---------- Signed in ---------- */

function DoneStep({ name, email, onSignOut }: { name: string; email: string; onSignOut(): void }) {
  return (
    <Step
      title={`Welcome, ${name.split(" ")[0]}`}
      sub={email}
      before={
        <View style={styles.welcomeMark}>
          <Mark size={34} />
        </View>
      }
    >
      <Button variant="secondary" onPress={onSignOut}>
        Sign out
      </Button>
    </Step>
  );
}

/* ---------- Building blocks ---------- */

function Step({
  title,
  sub,
  before,
  children,
}: {
  title: string;
  sub?: ReactNode;
  before?: ReactNode;
  children: ReactNode;
}) {
  const { colors, compact } = useTheme();
  const enter = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let animation: Animated.CompositeAnimation | undefined;
    AccessibilityInfo.isReduceMotionEnabled().then((reduce) => {
      if (reduce) return enter.setValue(1);
      animation = Animated.timing(enter, {
        toValue: 1,
        duration: 260,
        easing: Easing.bezier(0.2, 0.7, 0.2, 1),
        useNativeDriver: true,
      });
      animation.start();
    });
    return () => animation?.stop();
  }, [enter]);

  return (
    <Animated.View
      style={[
        styles.step,
        {
          opacity: enter,
          transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [6, 0] }) }],
        },
      ]}
    >
      {before}
      <View style={styles.head}>
        <Text
          accessibilityRole="header"
          style={[styles.title, { color: colors.fg, fontSize: compact ? 24 : 26 }]}
        >
          {title}
        </Text>
        {sub && <Text style={[styles.sub, { color: colors.muted }]}>{sub}</Text>}
      </View>
      {children}
    </Animated.View>
  );
}

function ErrorText({ children }: { children: string }) {
  const { colors } = useTheme();
  return (
    <Text style={[styles.small, styles.error, { color: colors.danger }]} accessibilityLiveRegion="polite">
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  step: { gap: 24 },
  head: { gap: 6, alignItems: "center" },
  title: { fontFamily: fonts.semibold, letterSpacing: -0.5, textAlign: "center", lineHeight: 30 },
  sub: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 22, textAlign: "center" },
  stack: { gap: 12 },
  small: { fontFamily: fonts.regular, fontSize: 13.5, lineHeight: 20 },
  error: { marginTop: -4 },
  divider: { flexDirection: "row", alignItems: "center", gap: 14 },
  rule: { flex: 1, height: 1 },
  dividerText: { fontFamily: fonts.regular, fontSize: 13 },
  codeMsg: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    minHeight: 21,
    marginTop: -2,
  },
  smallSpinner: { transform: [{ scale: 0.7 }], marginHorizontal: -3 },
  codeActions: { flexDirection: "row", justifyContent: "center", gap: 8, marginTop: -8 },
  tnum: { fontVariant: ["tabular-nums"] },
  welcomeMark: { alignSelf: "center", width: 44, height: 44, alignItems: "center", justifyContent: "center" },
});
