import { useMemo } from "react";
import type { ActiveTimer, Session, Task } from "../types";
import {
  dailyFocus,
  dayProgress,
  focusSecondsOnDay,
  liveSessions,
  suggestNext,
  taskSeconds,
  tasksCompletedOnDay,
} from "../lib/stats";

/** Everything derived for the dashboard, including the running timer's live time. */
export function useStats(tasks: Task[], sessions: Session[], active: ActiveTimer | null, now: Date) {
  const allSessions = useMemo(
    () => (active ? [...sessions, ...liveSessions(active, now)] : sessions),
    [sessions, active, now],
  );

  return useMemo(() => {
    const totals = new Map<string, number>();
    for (const t of tasks) totals.set(t.id, taskSeconds(allSessions, t.id));
    return {
      focusToday: focusSecondsOnDay(allSessions, now),
      completedToday: tasksCompletedOnDay(tasks, now),
      progress: dayProgress(tasks, now),
      week: dailyFocus(allSessions, now, 7),
      next: suggestNext(tasks, sessions, active?.taskId),
      taskTotals: totals,
    };
  }, [tasks, sessions, allSessions, active, now]);
}
