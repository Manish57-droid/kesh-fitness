import { useEffect, useState } from "react";

/**
 * Current date/time, refreshed every 30 seconds. `null` until mounted, so server and
 * browser never disagree about the time during hydration.
 */
export function useNow(intervalMs = 30_000) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
