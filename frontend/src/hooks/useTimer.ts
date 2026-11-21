import { useCallback, useEffect, useRef, useState } from "react";
import type { ActiveTimer, Session } from "../types";
import { storage } from "../services/storage";
import { buildSessions } from "../lib/stats";
import { uid } from "../lib/id";

type Options = {
  /** Called with the (midnight-split) sessions whenever a run ends. */
  onSave: (sessions: Session[]) => void;
  /** Called when a Pomodoro run reaches its target length. */
  onTargetReached?: (taskId: string) => void;
};

/**
 * Single active timer. Only one run exists at a time; starting another task
 * ends (and saves) the current run first. The run is persisted as
 * `{ taskId, startedAt }`, so a refresh recomputes elapsed time from the clock.
 */
export function useTimer({ onSave, onTargetReached }: Options, now: Date) {
  const [active, setActive] = useState<ActiveTimer | null>(() => storage.loadActiveTimer());
  const activeRef = useRef(active);
  activeRef.current = active;
  const onSaveRef = useRef(onSave);
  onSaveRef.current = onSave;
  const onTargetRef = useRef(onTargetReached);
  onTargetRef.current = onTargetReached;

  useEffect(() => storage.saveActiveTimer(active), [active]);

  /** End the current run at `endAt` (default: now) and save it. Returns the ended task id. */
  const end = useCallback((endAt?: Date): string | null => {
    const cur = activeRef.current;
    if (!cur) return null;
    const start = new Date(cur.startedAt);
    let stop = endAt ?? new Date();
    if (cur.targetSec != null) {
      const cap = new Date(start.getTime() + cur.targetSec * 1000);
      if (stop > cap) stop = cap;
    }
    onSaveRef.current(buildSessions(cur.taskId, start, stop, uid));
    activeRef.current = null;
    setActive(null);
    return cur.taskId;
  }, []);

  const start = useCallback(
    (taskId: string, targetSec?: number) => {
      if (activeRef.current) end();
      const next: ActiveTimer = {
        taskId,
        startedAt: new Date().toISOString(),
        ...(targetSec ? { targetSec } : {}),
      };
      activeRef.current = next;
      setActive(next);
    },
    [end],
  );

  /** Drop the current run without saving (used when its task is deleted). */
  const discard = useCallback(() => {
    activeRef.current = null;
    setActive(null);
  }, []);

  const elapsedSec = active
    ? Math.max(0, Math.floor((now.getTime() - Date.parse(active.startedAt)) / 1000))
    : 0;

  // Pomodoro: auto-end the run once it reaches its target (also after a refresh).
  useEffect(() => {
    if (!active?.targetSec || elapsedSec < active.targetSec) return;
    const taskId = active.taskId;
    end();
    onTargetRef.current?.(taskId);
  }, [active, elapsedSec, end]);

  return {
    active,
    elapsedSec: active?.targetSec ? Math.min(elapsedSec, active.targetSec) : elapsedSec,
    start,
    end,
    discard,
  };
}
