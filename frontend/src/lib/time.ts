/**
 * Pure date/time helpers. Everything here works in the runtime's local
 * timezone, so "today" matches the user's wall clock (including DST).
 */

export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Calendar-day arithmetic (DST-safe: always lands on local midnight). */
export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Local "YYYY-MM-DD" key. */
export function dayKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export type Interval = { start: Date; end: Date };

/**
 * Split [start, end) at every local midnight it crosses, so each piece
 * belongs to exactly one calendar day. Empty or inverted ranges yield [].
 */
export function splitAtMidnight(start: Date, end: Date): Interval[] {
  if (!(end.getTime() > start.getTime())) return [];
  const out: Interval[] = [];
  let cur = start;
  for (;;) {
    const nextMidnight = addDays(startOfDay(cur), 1);
    if (nextMidnight.getTime() >= end.getTime()) {
      out.push({ start: cur, end });
      return out;
    }
    out.push({ start: cur, end: nextMidnight });
    cur = nextMidnight;
  }
}

export function secondsBetween(start: Date, end: Date): number {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 1000));
}

/** 3725 -> "01:02:05" */
export function formatClock(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return [h, m, sec].map((n) => String(n).padStart(2, "0")).join(":");
}

/** "25:00" style for countdowns under an hour. */
export function formatShortClock(totalSec: number): string {
  const s = Math.max(0, Math.ceil(totalSec));
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/** 8040 -> "2h 14m", 840 -> "14m", 30 -> "<1m", 0 -> "0m" */
export function formatDuration(totalSec: number): string {
  const s = Math.max(0, Math.floor(totalSec));
  if (s === 0) return "0m";
  if (s < 60) return "<1m";
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

/** "Sat, Nov 21" */
export function formatHeaderDate(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

/** "Sat" */
export function formatWeekday(d: Date): string {
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

/** "9:41 AM" */
export function formatTimeOfDay(d: Date): string {
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function greeting(d: Date): string {
  const h = d.getHours();
  if (h < 5) return "Working late";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
