/**
 * Pure stats functions. Totals are always recomputed from tasks + sessions;
 * nothing derived here is ever persisted.
 */
import type { ActiveTimer, Session, Task } from "../types";
import {
  addDays,
  dayKey,
  formatWeekday,
  isSameDay,
  secondsBetween,
  splitAtMidnight,
  startOfDay,
} from "./time";

/** Turn one timer run into sessions, split at local midnight. Zero-length pieces are dropped. */
export function buildSessions(
  taskId: string,
  start: Date,
  end: Date,
  makeId: () => string,
): Session[] {
  return splitAtMidnight(start, end)
    .map(({ start: s, end: e }) => ({
      id: makeId(),
      taskId,
      startedAt: s.toISOString(),
      endedAt: e.toISOString(),
      durationSec: secondsBetween(s, e),
    }))
    .filter((s) => s.durationSec > 0);
}

/** Sessions for a running timer as of `now`, so live time counts in stats. */
export function liveSessions(timer: ActiveTimer | null, now: Date): Session[] {
  if (!timer) return [];
  let i = 0;
  return buildSessions(timer.taskId, new Date(timer.startedAt), now, () => `live-${i++}`);
}

export function focusSecondsOnDay(sessions: Session[], day: Date): number {
  return sessions.reduce(
    (sum, s) => (isSameDay(new Date(s.startedAt), day) ? sum + s.durationSec : sum),
    0,
  );
}

function completedOn(t: Task, day: Date): boolean {
  return t.status === "done" && !!t.completedAt && isSameDay(new Date(t.completedAt), day);
}

export function tasksCompletedOnDay(tasks: Task[], day: Date): Task[] {
  return tasks.filter((t) => completedOn(t, day));
}

export type DayProgress = { done: number; total: number; rate: number | null };

/**
 * Today's plan = tasks still open (created on or before `day`) plus tasks
 * finished on `day`. Rate is done / plan; null when nothing is planned.
 * Counting carried-over open tasks keeps the rate from exceeding 100%
 * when you finish yesterday's work.
 */
export function dayProgress(tasks: Task[], day: Date): DayProgress {
  const endOfDay = addDays(startOfDay(day), 1).getTime();
  let done = 0;
  let total = 0;
  for (const t of tasks) {
    if (completedOn(t, day)) {
      done++;
      total++;
    } else if (t.status !== "done" && new Date(t.createdAt).getTime() < endOfDay) {
      total++;
    }
  }
  return { done, total, rate: total === 0 ? null : done / total };
}

export type DailyFocus = { key: string; label: string; seconds: number; isToday: boolean };

/** Focus seconds for the `days` calendar days ending on `today` (oldest first). */
export function dailyFocus(sessions: Session[], today: Date, days = 7): DailyFocus[] {
  const totals = new Map<string, number>();
  for (const s of sessions) {
    const k = dayKey(new Date(s.startedAt));
    totals.set(k, (totals.get(k) ?? 0) + s.durationSec);
  }
  const out: DailyFocus[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = addDays(startOfDay(today), -i);
    const k = dayKey(d);
    out.push({ key: k, label: formatWeekday(d), seconds: totals.get(k) ?? 0, isToday: i === 0 });
  }
  return out;
}

export function taskSeconds(sessions: Session[], taskId: string): number {
  return sessions.reduce((sum, s) => (s.taskId === taskId ? sum + s.durationSec : sum), 0);
}

export type Suggestion = { task: Task; remainingMin?: number };

/**
 * Rule-based "up next": among unfinished tasks (excluding the running one),
 * pick the smallest remaining estimate. Tasks without an estimate come
 * after; ties go to the oldest task.
 */
export function suggestNext(
  tasks: Task[],
  sessions: Session[],
  excludeId?: string,
): Suggestion | null {
  const candidates: Suggestion[] = tasks
    .filter((t) => t.status !== "done" && t.id !== excludeId)
    .map((t) => ({
      task: t,
      remainingMin:
        t.estimateMin != null
          ? Math.max(0, Math.ceil(t.estimateMin - taskSeconds(sessions, t.id) / 60))
          : undefined,
    }));
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => {
    const ea = a.remainingMin ?? Number.POSITIVE_INFINITY;
    const eb = b.remainingMin ?? Number.POSITIVE_INFINITY;
    if (ea !== eb) return ea - eb;
    return a.task.createdAt.localeCompare(b.task.createdAt);
  });
  return candidates[0];
}
