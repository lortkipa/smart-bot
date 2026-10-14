import { z } from "zod";

/** Digits in an email verification code. */
export const CODE_LENGTH = 6;
/** Wrong codes allowed before the code is locked and the user has to start over. */
export const MAX_CODE_ATTEMPTS = 3;
/** Wait before another code can be sent. */
export const RESEND_CODE_SECONDS = 30;

export const EmailAddress = z.email();

export type VerifyCodeResult = { ok: true } | { ok: false; attemptsLeft: number };

export interface GoogleAccount {
  email: string;
  name: string;
}

const MOCK_CODE = "123456";
const MOCK_GOOGLE_ACCOUNT: GoogleAccount = { name: "Alex Morgan", email: "alex.morgan@gmail.com" };

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Stand-in for the auth API until the server implements it. Same shape the real client will have,
 * so clients only swap the constructor.
 */
export function createMockAuthClient() {
  const attempts = new Map<string, number>();
  let announced = false;

  return {
    async startEmail(email: string): Promise<void> {
      await wait(700);
      attempts.set(email, 0);
      if (!announced) {
        announced = true;
        console.info(`[mock auth] verification code is ${MOCK_CODE}`);
      }
    },

    async resendCode(email: string): Promise<void> {
      attempts.set(email, 0);
    },

    async verifyCode(email: string, code: string): Promise<VerifyCodeResult> {
      await wait(650);
      if (code === MOCK_CODE) {
        attempts.delete(email);
        return { ok: true };
      }
      const used = (attempts.get(email) ?? 0) + 1;
      attempts.set(email, used);
      return { ok: false, attemptsLeft: Math.max(0, MAX_CODE_ATTEMPTS - used) };
    },

    async signInWithGoogle(): Promise<GoogleAccount> {
      await wait(1100);
      return MOCK_GOOGLE_ACCOUNT;
    },

    async completeProfile(_name: string): Promise<void> {
      await wait(600);
    },
  };
}

export type AuthClient = ReturnType<typeof createMockAuthClient>;
