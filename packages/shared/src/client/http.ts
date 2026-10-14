import { HealthResponse } from "../schemas/health";

export interface ApiClientOptions {
  /** Absolute origin like `http://localhost:3000`, or "" for same-origin (web). */
  baseUrl: string;
}

export function createApiClient({ baseUrl }: ApiClientOptions) {
  const root = baseUrl.replace(/\/$/, "");

  async function get<T>(path: string, parse: (data: unknown) => T): Promise<T> {
    const res = await fetch(`${root}${path}`);
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
    return parse(await res.json());
  }

  return {
    health: () => get("/api/health", (d) => HealthResponse.parse(d)),
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
