import { createApiClient } from "@smart-bot/shared";

/**
 * "" means same origin: the Vite proxy in dev, the API server itself in prod.
 * The desktop release build sets VITE_API_URL because its page is served from tauri://.
 */
export const baseUrl: string = import.meta.env.VITE_API_URL ?? "";

export const api = createApiClient({ baseUrl });
