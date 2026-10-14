import { createApiClient } from "@smart-bot/shared";

/**
 * Inlined by Metro at bundle time. `scripts/mobile.mjs` sets it per platform and mode:
 * Android emulator reaches the host at 10.0.2.2, the iOS Simulator at localhost.
 */
export const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://10.0.2.2:3000";

export const api = createApiClient({ baseUrl });
