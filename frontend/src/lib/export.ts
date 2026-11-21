import type { Session, Task } from "../types";
import { dayKey, isSameDay } from "./time";

export type LogRow = {
  task: string;
  status: string;
  startedAt: string;
  endedAt: string;
  durationSec: number;
};

const COLUMNS: (keyof LogRow)[] = ["task", "status", "startedAt", "endedAt", "durationSec"];

export function dayLog(tasks: Task[], sessions: Session[], day: Date): LogRow[] {
  const byId = new Map(tasks.map((t) => [t.id, t]));
  return sessions
    .filter((s) => isSameDay(new Date(s.startedAt), day))
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt))
    .map((s) => ({
      task: byId.get(s.taskId)?.title ?? "(deleted)",
      status: byId.get(s.taskId)?.status ?? "",
      startedAt: s.startedAt,
      endedAt: s.endedAt,
      durationSec: s.durationSec,
    }));
}

function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\n\r]/.test(s) ? `"${s.split('"').join('""')}"` : s;
}

export function toCsv(rows: LogRow[]): string {
  const lines = rows.map((r) => COLUMNS.map((c) => csvCell(r[c])).join(","));
  return [COLUMNS.join(","), ...lines].join("\n");
}

export function exportFilename(day: Date, ext: "json" | "csv"): string {
  return `focus-log-${dayKey(day)}.${ext}`;
}

export function download(filename: string, content: string, mime: string): void {
  const url = URL.createObjectURL(new Blob([content], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
