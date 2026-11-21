import { useState } from "react";
import type { Task } from "../types";
import { TaskItem } from "./TaskItem";

type Props = {
  tasks: Task[];
  activeId: string | null;
  totals: Map<string, number>;
  onStart: (id: string) => void;
  onPause: () => void;
  onStop: (id: string) => void;
  onToggleDone: (id: string) => void;
  onEdit: (id: string, title: string, estimateMin?: number) => void;
  onDelete: (id: string) => void;
};

const ORDER = { in_progress: 0, todo: 1, done: 2 } as const;

export function TaskList({ tasks, activeId, totals, ...handlers }: Props) {
  const [showDone, setShowDone] = useState(true);

  const sorted = [...tasks].sort((a, b) => {
    const ra = a.id === activeId ? -1 : ORDER[a.status];
    const rb = b.id === activeId ? -1 : ORDER[b.status];
    if (ra !== rb) return ra - rb;
    if (a.status === "done") return (b.completedAt ?? "").localeCompare(a.completedAt ?? "");
    return a.createdAt.localeCompare(b.createdAt);
  });
  const open = sorted.filter((t) => t.status !== "done");
  const done = sorted.filter((t) => t.status === "done");

  if (tasks.length === 0) {
    return (
      <div className="empty">
        <p className="empty-title">Nothing on the list.</p>
        <p>Type a task above and press Enter. Add minutes to get a time estimate.</p>
      </div>
    );
  }

  const item = (t: Task) => (
    <TaskItem
      key={t.id}
      task={t}
      running={t.id === activeId}
      seconds={totals.get(t.id) ?? 0}
      onStart={() => handlers.onStart(t.id)}
      onPause={handlers.onPause}
      onStop={() => handlers.onStop(t.id)}
      onToggleDone={() => handlers.onToggleDone(t.id)}
      onEdit={(title, est) => handlers.onEdit(t.id, title, est)}
      onDelete={() => handlers.onDelete(t.id)}
    />
  );

  return (
    <div className="task-groups">
      {open.length ? (
        <ul className="task-list" aria-label="Open tasks">
          {open.map(item)}
        </ul>
      ) : (
        <p className="all-clear">All clear. Every task is done.</p>
      )}
      {done.length ? (
        <>
          <button
            type="button"
            className="group-toggle"
            onClick={() => setShowDone((v) => !v)}
            aria-expanded={showDone}
          >
            <span className={`caret ${showDone ? "open" : ""}`} aria-hidden="true" />
            Done · {done.length}
          </button>
          {showDone ? (
            <ul className="task-list" aria-label="Done tasks">
              {done.map(item)}
            </ul>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
