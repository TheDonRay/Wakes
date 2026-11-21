import { useCallback, useEffect, useRef, useState } from "react";
import type { BreakState, Settings } from "./types";
import { storage } from "./services/storage";
import { useTasks } from "./hooks/useTasks";
import { useTimer } from "./hooks/useTimer";
import { useStats } from "./hooks/useStats";
import { useNow } from "./hooks/useNow";
import { dayLog, download, exportFilename, toCsv } from "./lib/export";
import { formatDuration } from "./lib/time";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { StatCard } from "./components/StatCard";
import { Card } from "./components/Card";
import { TaskForm } from "./components/TaskForm";
import { TaskList } from "./components/TaskList";
import { WeeklyChart } from "./components/WeeklyChart";
import { CompletedToday } from "./components/CompletedToday";

const FOCUS_SEC = 25 * 60;
const BREAK_SEC = 5 * 60;

function notify(title: string, body: string) {
  try {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/favicon.svg" });
    }
  } catch {
    // Notifications unavailable; the on-screen break timer still shows.
  }
}

function vsYesterday(today: number, yesterday: number): string {
  if (today === 0 && yesterday === 0) return "No focus logged yet";
  const diff = today - yesterday;
  if (Math.abs(diff) < 60) return "Same as yesterday";
  return `${diff > 0 ? "+" : "−"}${formatDuration(Math.abs(diff))} vs yesterday`;
}

export default function App() {
  const now = useNow(1000);
  const { tasks, sessions, addTask, editTask, setStatus, deleteTask, addSessions } = useTasks();
  const [settings, setSettings] = useState<Settings>(() => storage.loadSettings());
  const [breakState, setBreakState] = useState<BreakState | null>(() => storage.loadBreak());
  const lastTaskRef = useRef<string | null>(null);
  const addInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => storage.saveSettings(settings), [settings]);
  useEffect(() => storage.saveBreak(breakState), [breakState]);

  const timer = useTimer(
    {
      onSave: addSessions,
      onTargetReached: (taskId) => {
        lastTaskRef.current = taskId;
        setBreakState({ endsAt: new Date(Date.now() + BREAK_SEC * 1000).toISOString() });
        const title = tasks.find((t) => t.id === taskId)?.title ?? "Focus block";
        notify("Focus block done", `${title}: take a 5 minute break.`);
      },
    },
    now,
  );
  const activeId = timer.active?.taskId ?? null;
  if (activeId) lastTaskRef.current = activeId;

  // A stored run whose task no longer exists (e.g. edited storage) is dropped.
  useEffect(() => {
    if (activeId && !tasks.some((t) => t.id === activeId)) timer.discard();
  }, [activeId, tasks, timer]);

  // Clear an expired break and announce it once.
  useEffect(() => {
    if (breakState && Date.parse(breakState.endsAt) <= now.getTime()) {
      setBreakState(null);
      notify("Break over", "Ready for the next block?");
    }
  }, [breakState, now]);

  const stats = useStats(tasks, sessions, timer.active, now);

  const start = useCallback(
    (id: string) => {
      timer.start(id, settings.pomodoro ? FOCUS_SEC : undefined);
      setStatus(id, "in_progress");
      setBreakState(null);
    },
    [timer, settings.pomodoro, setStatus],
  );

  const pause = useCallback(() => {
    timer.end();
  }, [timer]);

  const stop = useCallback(
    (id: string) => {
      if (activeId === id) timer.end();
      setStatus(id, "todo");
    },
    [activeId, timer, setStatus],
  );

  const toggleDone = useCallback(
    (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (!task) return;
      if (task.status === "done") {
        const worked = sessions.some((s) => s.taskId === id);
        setStatus(id, worked ? "in_progress" : "todo");
      } else {
        if (activeId === id) timer.end();
        setStatus(id, "done");
      }
    },
    [tasks, sessions, activeId, timer, setStatus],
  );

  const remove = useCallback(
    (id: string) => {
      if (activeId === id) timer.discard();
      if (lastTaskRef.current === id) lastTaskRef.current = null;
      deleteTask(id);
    },
    [activeId, timer, deleteTask],
  );

  const togglePomodoro = useCallback(() => {
    setSettings((s) => {
      const next = { ...s, pomodoro: !s.pomodoro };
      if (next.pomodoro && "Notification" in window && Notification.permission === "default") {
        void Notification.requestPermission();
      }
      return next;
    });
  }, []);

  const exportLog = useCallback(
    (kind: "json" | "csv") => {
      const rows = dayLog(tasks, [...sessions], new Date());
      if (kind === "json") {
        download(exportFilename(new Date(), "json"), JSON.stringify(rows, null, 2), "application/json");
      } else {
        download(exportFilename(new Date(), "csv"), toCsv(rows), "text/csv");
      }
    },
    [tasks, sessions],
  );

  // Global shortcuts (ignored while typing).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return;
      const key = e.key.toLowerCase();
      // Space on a focused button should press that button, not toggle the timer.
      if (key === " " && el?.tagName === "BUTTON") return;
      if (key === "n") {
        e.preventDefault();
        addInputRef.current?.focus();
      } else if (key === " ") {
        e.preventDefault();
        if (activeId) return pause();
        const last = lastTaskRef.current && tasks.find((t) => t.id === lastTaskRef.current && t.status !== "done");
        const target = last || stats.next?.task;
        if (target) start(target.id);
      } else if (key === "s") {
        if (activeId) stop(activeId);
      } else if (key === "p") {
        togglePomodoro();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeId, tasks, stats.next, pause, start, stop, togglePomodoro]);

  const activeTask = tasks.find((t) => t.id === activeId);
  const openCount = tasks.filter((t) => t.status !== "done").length;
  const { done, total, rate } = stats.progress;
  const todaysSessions = stats.week[stats.week.length - 1].seconds > 0;

  return (
    <div className="app">
      <Sidebar
        now={now}
        active={timer.active}
        activeTask={activeTask}
        elapsedSec={timer.elapsedSec}
        pomodoro={settings.pomodoro}
        breakState={breakState}
        next={stats.next}
        onTogglePomodoro={togglePomodoro}
        onPause={pause}
        onStop={() => activeId && stop(activeId)}
        onStart={start}
        onSkipBreak={() => setBreakState(null)}
      />

      <main className="main">
        <Header
          now={now}
          focusToday={stats.focusToday}
          openCount={openCount}
          onExport={exportLog}
          canExport={todaysSessions && !timer.active}
        />

        <div className="stats">
          <StatCard
            label="Focus today"
            value={formatDuration(stats.focusToday)}
            detail={vsYesterday(stats.focusToday, stats.week[stats.week.length - 2]?.seconds ?? 0)}
          />
          <StatCard
            label="Done today"
            value={
              <>
                {done}
                <span className="stat-of">/{total}</span>
              </>
            }
            detail={total - done > 0 ? `${total - done} still open` : total ? "Everything finished" : "No tasks yet"}
          />
          <StatCard
            label="Completion rate"
            value={rate == null ? "—" : `${Math.round(rate * 100)}%`}
            meter={rate}
            detail="Finished today out of today's list"
          />
        </div>

        <div className="grid">
          <Card
            title="Tasks"
            icon="list"
            className="card-tasks"
            aside={<span className="count">{openCount} open</span>}
          >
            <TaskForm ref={addInputRef} onAdd={addTask} />
            <TaskList
              tasks={tasks}
              activeId={activeId}
              totals={stats.taskTotals}
              onStart={start}
              onPause={pause}
              onStop={stop}
              onToggleDone={toggleDone}
              onEdit={editTask}
              onDelete={remove}
            />
          </Card>

          <div className="col">
            <Card title="Last 7 days" icon="chart">
              <WeeklyChart data={stats.week} />
            </Card>
            <Card
              title="Completed today"
              icon="flag"
              aside={<span className="count">{stats.completedToday.length}</span>}
            >
              <CompletedToday tasks={stats.completedToday} totals={stats.taskTotals} />
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
