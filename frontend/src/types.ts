export type TaskStatus = "todo" | "in_progress" | "done";

export type Task = {
  id: string;
  title: string;
  estimateMin?: number;
  status: TaskStatus;
  createdAt: string; // ISO
  completedAt?: string; // ISO
};

export type Session = {
  id: string;
  taskId: string;
  startedAt: string; // ISO
  endedAt: string; // ISO
  durationSec: number;
};

export type ActiveTimer = {
  taskId: string;
  startedAt: string; // ISO
  /** Set when the run is a Pomodoro focus block; the run auto-pauses at this length. */
  targetSec?: number;
};

export type Settings = {
  pomodoro: boolean;
};

export type BreakState = {
  endsAt: string; // ISO
};
