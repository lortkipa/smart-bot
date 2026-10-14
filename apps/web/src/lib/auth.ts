import { createMockAuthClient } from "@smart-bot/shared";

/** Mocked until the server implements auth. The verification code is logged to the console. */
export const auth = createMockAuthClient();
