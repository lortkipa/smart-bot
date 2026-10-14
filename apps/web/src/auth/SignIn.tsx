import { CODE_LENGTH, EmailAddress, RESEND_CODE_SECONDS } from "@smart-bot/shared";
import { type ButtonHTMLAttributes, type ReactNode, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { auth } from "../lib/auth";
import mark from "../mark.svg";
import markDark from "../mark-dark.svg";
import { GoogleIcon } from "./GoogleIcon";
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
  const [email, setEmail] = useState(prefill);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<Method>();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!autoFocus) return;
    inputRef.current?.focus();
    if (prefill) inputRef.current?.select();
  }, [autoFocus, prefill]);

  const fail = (message: string) => {
    setError(message);
    inputRef.current?.focus();
  };

  return (
    <Step title="Sign in to Smart Bot">
      <div className="stack">
        <form
          className="stack"
          noValidate
          onSubmit={async (e) => {
            e.preventDefault();
            const value = email.trim().toLowerCase();
            if (!value) return fail("Enter your email address.");
            if (!EmailAddress.safeParse(value).success) return fail("Enter a valid email address.");
            setLoading("email");
            await auth.startEmail(value);
            onEmail(value);
          }}
        >
          <label className="sr-only" htmlFor="email">
            Email address
          </label>
          <input
            ref={inputRef}
            className="input"
            id="email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="Email address"
            spellCheck={false}
            autoCapitalize="off"
            value={email}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? "email-error" : undefined}
            onChange={(e) => {
              setEmail(e.target.value);
              setError("");
            }}
          />
          {error && (
            <p className="error" id="email-error">
              {error}
            </p>
          )}
          <Button variant="primary" type="submit" loading={loading === "email"} disabled={!!loading}>
            Continue with Email
          </Button>
        </form>

        <div className="divider" aria-hidden="true">
          or
        </div>

        <Button
          variant="secondary"
          icon={<GoogleIcon />}
          loading={loading === "google"}
          disabled={!!loading}
          onClick={async () => {
            setLoading("google");
            onGoogle(await auth.signInWithGoogle());
          }}
        >
          Continue with Google
        </Button>
      </div>
    </Step>
  );
}

/* ---------- Step 2: verification code ---------- */

const emptyCode = () => Array.from({ length: CODE_LENGTH }, () => "");

type CodeStatus = { text: string; tone?: "error"; busy?: boolean };

function CodeStep({ email, onVerified, onBack }: { email: string; onVerified(): void; onBack(): void }) {
  const [code, setCode] = useState(emptyCode);
  const [status, setStatus] = useState<CodeStatus>({ text: "" });
  const [invalid, setInvalid] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [locked, setLocked] = useState(false);
  const [shake, setShake] = useState(0);
  const resend = useCountdown();
  const otpRef = useRef<OtpInputHandle>(null);
  const backRef = useRef<HTMLButtonElement>(null);

  const { start: startResendTimer } = resend;
  useEffect(() => {
    startResendTimer(RESEND_CODE_SECONDS);
    otpRef.current?.focus();
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
      backRef.current?.focus();
      return;
    }
    // Commit synchronously so the boxes are enabled before focusing the first one.
    flushSync(() => {
      setVerifying(false);
      setCode(emptyCode());
      const left = result.attemptsLeft;
      setStatus({
        text: `Incorrect code. ${left} ${left === 1 ? "attempt" : "attempts"} left.`,
        tone: "error",
      });
    });
    otpRef.current?.focus();
  };

  return (
    <Step
      title="Check your email"
      sub={
        <>
          Enter the {CODE_LENGTH}-digit code sent to <strong>{email}</strong>
        </>
      }
    >
      <form className="stack" noValidate onSubmit={(e) => e.preventDefault()}>
        <fieldset className="otp-fieldset">
          <legend className="sr-only">Verification code</legend>
          <OtpInput
            ref={otpRef}
            value={code}
            disabled={verifying || locked}
            invalid={invalid}
            shake={shake}
            onChange={(next) => {
              setCode(next);
              if (!locked) setInvalid(false);
              const value = next.join("");
              if (value.length === CODE_LENGTH) void verify(value);
            }}
          />
        </fieldset>
        <p className="code-msg" role="status" aria-live="polite" data-tone={status.tone}>
          {status.busy && <span className="spinner" aria-hidden="true" />}
          {status.text}
        </p>
      </form>

      <div className="code-actions">
        {!locked && (
          <button
            className="btn btn-text"
            type="button"
            disabled={verifying || resend.left > 0}
            onClick={async () => {
              await auth.resendCode(email);
              flushSync(() => {
                setCode(emptyCode());
                setInvalid(false);
                setStatus({ text: "" });
              });
              resend.start(RESEND_CODE_SECONDS);
              otpRef.current?.focus();
            }}
          >
            {/* One flex item, so the button's icon gap doesn't split the text from the timer. */}
            <span>
              {resend.left > 0 ? (
                <>
                  Resend code in <span className="tnum">{formatSeconds(resend.left)}</span>
                </>
              ) : (
                "Resend code"
              )}
            </span>
          </button>
        )}
        <button ref={backRef} className="btn btn-text" type="button" onClick={onBack}>
          Try a different Email
        </button>
      </div>
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
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const input = inputRef.current;
    if (!input) return;
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  }, []);

  return (
    <Step title="What's your name?">
      <form
        className="stack"
        noValidate
        onSubmit={async (e) => {
          e.preventDefault();
          const value = name.trim().replace(/\s+/g, " ");
          if (!value) {
            setError("Enter your name.");
            inputRef.current?.focus();
            return;
          }
          setLoading(true);
          await auth.completeProfile(value);
          onDone(value);
        }}
      >
        <label className="sr-only" htmlFor="name">
          Full name
        </label>
        <input
          ref={inputRef}
          className="input"
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="Your name"
          value={name}
          aria-invalid={error ? true : undefined}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
        />
        {error && <p className="error">{error}</p>}
        <Button variant="primary" type="submit" loading={loading} disabled={loading || !name.trim()}>
          Continue
        </Button>
      </form>

      <button className="btn btn-text" type="button" onClick={onBack}>
        Try a different Email
      </button>
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
        <picture className="welcome-mark">
          <source srcSet={markDark} media="(prefers-color-scheme: dark)" />
          <img src={mark} alt="" />
        </picture>
      }
    >
      <Button variant="secondary" autoFocus onClick={onSignOut}>
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
  return (
    <section className="step" aria-labelledby="step-title">
      {before}
      <div className="head">
        <h1 id="step-title">{title}</h1>
        {sub && <p className="sub">{sub}</p>}
      </div>
      {children}
    </section>
  );
}

function Button({
  variant,
  loading = false,
  icon,
  children,
  disabled,
  type = "button",
  ...rest
}: {
  variant: "primary" | "secondary";
  loading?: boolean;
  icon?: ReactNode;
} & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...rest}
      type={type}
      className={`btn btn-${variant}${loading ? " is-loading" : ""}`}
      disabled={disabled || loading}
      aria-busy={loading}
    >
      {icon}
      <span className="label">{children}</span>
    </button>
  );
}
