import { useEffect, useState } from "react";

/**
 * Current time, re-rendered every `intervalMs`. Only used to trigger
 * repaints: elapsed time is always computed from Date differences, so a
 * throttled background tab never loses seconds.
 */
export function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    setNow(new Date());
    const id = window.setInterval(() => setNow(new Date()), intervalMs);
    const onVisible = () => setNow(new Date());
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [intervalMs]);
  return now;
}
