import { connectRealtime, type HealthResponse, type RealtimeStatus } from "@smart-bot/shared";
import { useEffect, useState } from "react";
import { api, baseUrl } from "./api";

export function useServerStatus() {
  const [health, setHealth] = useState<HealthResponse>();
  const [error, setError] = useState<string>();
  const [realtime, setRealtime] = useState<RealtimeStatus>("connecting");

  useEffect(() => {
    api
      .health()
      .then(setHealth)
      .catch((e: unknown) => setError(String(e)));
    const conn = connectRealtime({ baseUrl, onStatus: setRealtime });
    return () => conn.close();
  }, []);

  return { health, error, realtime };
}
