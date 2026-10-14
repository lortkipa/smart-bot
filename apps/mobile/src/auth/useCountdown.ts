import { useEffect, useState } from "react";

/** Seconds left on a one-shot countdown. `start(n)` (re)starts it, `stop()` clears it. */
export function useCountdown() {
  const [left, setLeft] = useState(0);

  useEffect(() => {
    if (left <= 0) return;
    const timer = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(timer);
  }, [left]);

  return { left, start: setLeft, stop: () => setLeft(0) };
}

export function formatSeconds(total: number): string {
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
