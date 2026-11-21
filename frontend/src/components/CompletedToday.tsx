import type { Task } from "../types";
import { formatDuration, formatTimeOfDay } from "../lib/time";

export function CompletedToday({ tasks, totals }: { tasks: Task[]; totals: Map<string, number> }) {
  if (tasks.length === 0) {
    return <p className="empty-inline">Finished tasks show up here with the time they took.</p>;
  }
  const sorted = [...tasks].sort((a, b) => (b.completedAt ?? "").localeCompare(a.completedAt ?? ""));
  return (
    <ol className="done-list">
      {sorted.map((t) => (
        <li key={t.id}>
          <span className="done-title">{t.title}</span>
          <span className="done-meta">
            {formatDuration(totals.get(t.id) ?? 0)}
            <span aria-hidden="true"> · </span>
            {formatTimeOfDay(new Date(t.completedAt!))}
          </span>
        </li>
      ))}
    </ol>
  );
}
