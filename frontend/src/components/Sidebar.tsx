import type { ActiveTimer, BreakState, Task } from "../types";
import type { Suggestion } from "../lib/stats";
import { formatClock, formatShortClock } from "../lib/time";
import { Icon } from "./Icon";

type Props = {
  now: Date;
  active: ActiveTimer | null;
  activeTask: Task | undefined;
  elapsedSec: number;
  pomodoro: boolean;
  breakState: BreakState | null;
  next: Suggestion | null;
  onTogglePomodoro: () => void;
  onPause: () => void;
  onStop: () => void;
  onFinish: () => void;
  onStart: (id: string) => void;
  onSkipBreak: () => void;
};

const SHORTCUTS: [string, string][] = [
  ["N", "New task"],
  ["Space", "Start / pause"],
  ["S", "Stop timer"],
  ["P", "Pomodoro"],
];

export function Sidebar(p: Props) {
  const breakLeft = p.breakState ? (Date.parse(p.breakState.endsAt) - p.now.getTime()) / 1000 : 0;
  const onBreak = !p.active && breakLeft > 0;
  const target = p.active?.targetSec;

  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true" />
        <span>Wakes</span>
      </div>

      <section className="now" aria-label="Current focus" aria-live="polite">
        {p.active && p.activeTask ? (
          <>
            <p className="now-label">
              <span className="dot" aria-hidden="true" /> {target ? "Focus block" : "This run"}
            </p>
            <p className="now-clock">
              {target ? formatShortClock(target - p.elapsedSec) : formatClock(p.elapsedSec)}
            </p>
            {target ? (
              <div className="meter meter-invert" aria-hidden="true">
                <span style={{ width: `${(p.elapsedSec / target) * 100}%` }} />
              </div>
            ) : null}
            <p className="now-task">{p.activeTask.title}</p>
            <div className="now-actions">
              <button type="button" className="pill pill-invert" onClick={p.onPause}>
                <Icon name="pause" size={12} /> Pause
              </button>
              <button type="button" className="pill pill-invert-ghost" onClick={p.onStop}>
                <Icon name="stop" size={12} /> Stop
              </button>
              <button
                type="button"
                className="pill pill-invert-ghost now-finish"
                onClick={p.onFinish}
                aria-label={`Finish "${p.activeTask.title}"`}
              >
                <Icon name="check" size={13} /> Finish task
              </button>
            </div>
          </>
        ) : onBreak ? (
          <>
            <p className="now-label">Break</p>
            <p className="now-clock">{formatShortClock(breakLeft)}</p>
            <p className="now-task">Step away from the screen.</p>
            <div className="now-actions">
              <button type="button" className="pill pill-invert-ghost" onClick={p.onSkipBreak}>
                Skip break
              </button>
            </div>
          </>
        ) : p.next ? (
          <>
            <p className="now-label">Up next</p>
            <p className="now-task now-task-lg">{p.next.task.title}</p>
            <p className="now-hint">
              {p.next.remainingMin != null
                ? `Shortest open estimate · ${p.next.remainingMin === 0 ? "over estimate" : `${p.next.remainingMin}m left`}`
                : "Oldest open task"}
            </p>
            <div className="now-actions">
              <button type="button" className="pill pill-invert" onClick={() => p.onStart(p.next!.task.id)}>
                <Icon name="play" size={12} /> Start
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="now-label">Idle</p>
            <p className="now-task now-task-lg">No open tasks.</p>
            <p className="now-hint">Press N to add one.</p>
          </>
        )}
      </section>

      <div className="side-block">
        <label className="switch">
          <span>
            <span className="switch-title">
              <Icon name="tomato" size={14} /> Pomodoro
            </span>
            <span className="switch-sub">25 min focus · 5 min break</span>
          </span>
          <input type="checkbox" checked={p.pomodoro} onChange={p.onTogglePomodoro} />
          <span className="switch-track" aria-hidden="true" />
        </label>
      </div>

      <div className="side-block shortcuts">
        <p className="side-title">
          <Icon name="keyboard" size={14} /> Shortcuts
        </p>
        <dl>
          {SHORTCUTS.map(([k, label]) => (
            <div key={k}>
              <dt>
                <kbd>{k}</kbd>
              </dt>
              <dd>{label}</dd>
            </div>
          ))}
        </dl>
      </div>

      <p className="side-foot">Stored on this device only.</p>
    </aside>
  );
}
