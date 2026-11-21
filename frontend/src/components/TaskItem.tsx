import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { Task } from "../types";
import { formatDuration } from "../lib/time";
import { Icon } from "./Icon";
import { TimerDisplay } from "./TimerDisplay";

type Props = {
  task: Task;
  running: boolean;
  seconds: number;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onToggleDone: () => void;
  onEdit: (title: string, estimateMin?: number) => void;
  onDelete: () => void;
};

export function TaskItem({
  task,
  running,
  seconds,
  onStart,
  onPause,
  onStop,
  onToggleDone,
  onEdit,
  onDelete,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [estimate, setEstimate] = useState(task.estimateMin?.toString() ?? "");
  const [confirming, setConfirming] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);

  const done = task.status === "done";
  const paused = task.status === "in_progress" && !running;

  useEffect(() => {
    if (editing) titleRef.current?.select();
  }, [editing]);

  useEffect(() => {
    if (!confirming) return;
    const id = window.setTimeout(() => setConfirming(false), 3000);
    return () => window.clearTimeout(id);
  }, [confirming]);

  function beginEdit() {
    setTitle(task.title);
    setEstimate(task.estimateMin?.toString() ?? "");
    setEditing(true);
  }

  function save() {
    if (!title.trim()) return setEditing(false);
    const est = parseInt(estimate, 10);
    onEdit(title, Number.isFinite(est) && est > 0 ? est : undefined);
    setEditing(false);
  }

  function onEditKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") save();
    if (e.key === "Escape") setEditing(false);
  }

  const over = task.estimateMin != null && seconds > task.estimateMin * 60;
  const statusLabel = done ? "Done" : running ? "Running" : paused ? "Paused" : "To do";

  return (
    <li className={`task ${done ? "is-done" : ""} ${running ? "is-running" : ""}`}>
      <button
        type="button"
        className={`check ${done ? "checked" : ""} ${paused || running ? "partial" : ""}`}
        onClick={onToggleDone}
        aria-label={done ? `Mark "${task.title}" as not done` : `Mark "${task.title}" as done`}
        aria-pressed={done}
      >
        {done ? <Icon name="check" size={14} /> : null}
      </button>

      {editing ? (
        <div className="task-edit">
          <input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={onEditKey}
            aria-label="Task title"
            maxLength={200}
          />
          <input
            className="task-form-est"
            value={estimate}
            onChange={(e) => setEstimate(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
            onKeyDown={onEditKey}
            inputMode="numeric"
            placeholder="min"
            aria-label="Estimate in minutes"
          />
          <button type="button" className="pill pill-solid" onClick={save}>
            Save
          </button>
        </div>
      ) : (
        <div className="task-body" onDoubleClick={done ? undefined : beginEdit}>
          <p className="task-title">{task.title}</p>
          <p className="task-meta">
            <span className="sr-only">Status: </span>
            {statusLabel}
            {task.estimateMin != null ? (
              <>
                <span aria-hidden="true"> · </span>
                <span className={over ? "over" : undefined}>
                  {formatDuration(seconds)} of {formatDuration(task.estimateMin * 60)}
                </span>
              </>
            ) : null}
          </p>
        </div>
      )}

      {!editing ? (
        <>
          {seconds > 0 || running ? <TimerDisplay seconds={seconds} running={running} /> : null}
          <div className="task-actions">
            {!done && running ? (
              <>
                <button type="button" className="icon-btn" onClick={onPause} aria-label={`Pause "${task.title}"`} title="Pause (Space)">
                  <Icon name="pause" size={14} />
                </button>
                <button type="button" className="icon-btn" onClick={onStop} aria-label={`Stop "${task.title}"`} title="Stop (S)">
                  <Icon name="stop" size={14} />
                </button>
              </>
            ) : null}
            {!done && !running ? (
              <button
                type="button"
                className="icon-btn icon-btn-primary"
                onClick={onStart}
                aria-label={`${paused ? "Resume" : "Start"} "${task.title}"`}
                title={paused ? "Resume" : "Start"}
              >
                <Icon name="play" size={14} />
              </button>
            ) : null}
            {!done ? (
              <button
                type="button"
                className="pill pill-finish"
                onClick={onToggleDone}
                aria-label={`Finish "${task.title}"`}
                title="Finish task (stops the timer and logs the time)"
              >
                <Icon name="check" size={13} /> Finish
              </button>
            ) : null}
            {!done ? (
              <button type="button" className="icon-btn ghost" onClick={beginEdit} aria-label={`Edit "${task.title}"`} title="Edit">
                <Icon name="edit" size={14} />
              </button>
            ) : null}
            {confirming ? (
              <button type="button" className="pill pill-danger" onClick={onDelete} aria-label={`Confirm delete "${task.title}"`}>
                Delete?
              </button>
            ) : (
              <button
                type="button"
                className="icon-btn ghost"
                onClick={() => setConfirming(true)}
                aria-label={`Delete "${task.title}"`}
                title="Delete"
              >
                <Icon name="trash" size={14} />
              </button>
            )}
          </div>
        </>
      ) : null}
    </li>
  );
}
