/**
 * The only module that touches localStorage. Hooks go through these
 * functions so components never know where data lives.
 */
import type { ActiveTimer, BreakState, Session, Settings, Task } from "../types";

const KEYS = {
  tasks: "fd.tasks",
  sessions: "fd.sessions",
  activeTimer: "fd.activeTimer",
  settings: "fd.settings",
  break: "fd.break",
} as const;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked (private mode): keep working in memory.
  }
}

export const storage = {
  loadTasks(): Task[] {
    const v = read<unknown>(KEYS.tasks, []);
    return Array.isArray(v) ? (v as Task[]) : [];
  },
  saveTasks(tasks: Task[]) {
    write(KEYS.tasks, tasks);
  },

  loadSessions(): Session[] {
    const v = read<unknown>(KEYS.sessions, []);
    return Array.isArray(v) ? (v as Session[]) : [];
  },
  saveSessions(sessions: Session[]) {
    write(KEYS.sessions, sessions);
  },

  loadActiveTimer(): ActiveTimer | null {
    const v = read<ActiveTimer | null>(KEYS.activeTimer, null);
    return v && typeof v.taskId === "string" && !Number.isNaN(Date.parse(v.startedAt)) ? v : null;
  },
  saveActiveTimer(t: ActiveTimer | null) {
    write(KEYS.activeTimer, t);
  },

  loadSettings(): Settings {
    return { pomodoro: false, ...read<Partial<Settings>>(KEYS.settings, {}) };
  },
  saveSettings(s: Settings) {
    write(KEYS.settings, s);
  },

  loadBreak(): BreakState | null {
    const v = read<BreakState | null>(KEYS.break, null);
    return v && !Number.isNaN(Date.parse(v.endsAt)) ? v : null;
  },
  saveBreak(b: BreakState | null) {
    write(KEYS.break, b);
  },
};
