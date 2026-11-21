import { useCallback, useEffect, useState } from "react";
import type { Session, Task, TaskStatus } from "../types";
import { storage } from "../services/storage";
import { uid } from "../lib/id";

/** Tasks and their saved sessions. Both persist through `storage`. */
export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>(() => storage.loadTasks());
  const [sessions, setSessions] = useState<Session[]>(() => storage.loadSessions());

  useEffect(() => storage.saveTasks(tasks), [tasks]);
  useEffect(() => storage.saveSessions(sessions), [sessions]);

  const addTask = useCallback((title: string, estimateMin?: number) => {
    const clean = title.trim();
    if (!clean) return;
    const task: Task = {
      id: uid(),
      title: clean,
      status: "todo",
      createdAt: new Date().toISOString(),
      ...(estimateMin && estimateMin > 0 ? { estimateMin } : {}),
    };
    setTasks((prev) => [...prev, task]);
  }, []);

  const editTask = useCallback((id: string, title: string, estimateMin?: number) => {
    const clean = title.trim();
    if (!clean) return;
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const next: Task = { ...t, title: clean };
        if (estimateMin && estimateMin > 0) next.estimateMin = estimateMin;
        else delete next.estimateMin;
        return next;
      }),
    );
  }, []);

  const setStatus = useCallback((id: string, status: TaskStatus) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id || t.status === status) return t;
        const next: Task = { ...t, status };
        if (status === "done") next.completedAt = new Date().toISOString();
        else delete next.completedAt;
        return next;
      }),
    );
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setSessions((prev) => prev.filter((s) => s.taskId !== id));
  }, []);

  const addSessions = useCallback((list: Session[]) => {
    if (list.length) setSessions((prev) => [...prev, ...list]);
  }, []);

  return { tasks, sessions, addTask, editTask, setStatus, deleteTask, addSessions };
}
