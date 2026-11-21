import { formatClock } from "../lib/time";

/** Monospace HH:MM:SS. Running timers render as the solid white pill with a blinking dot. */
export function TimerDisplay({ seconds, running }: { seconds: number; running: boolean }) {
  return (
    <span className={`timer ${running ? "timer-running" : ""}`} aria-label={running ? "Running" : undefined}>
      {running ? <span className="dot" aria-hidden="true" /> : null}
      <time>{formatClock(seconds)}</time>
    </span>
  );
}
