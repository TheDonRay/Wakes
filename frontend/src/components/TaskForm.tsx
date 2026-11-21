import { forwardRef, useState, type FormEvent } from "react";
import { Icon } from "./Icon";

type Props = { onAdd: (title: string, estimateMin?: number) => void };

export const TaskForm = forwardRef<HTMLInputElement, Props>(function TaskForm({ onAdd }, ref) {
  const [title, setTitle] = useState("");
  const [estimate, setEstimate] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    const est = parseInt(estimate, 10);
    onAdd(title, Number.isFinite(est) && est > 0 ? est : undefined);
    setTitle("");
    setEstimate("");
  }

  return (
    <form className="task-form" onSubmit={submit}>
      <span className="task-form-plus" aria-hidden="true">
        <Icon name="plus" />
      </span>
      <input
        ref={ref}
        className="task-form-title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setTitle("");
            setEstimate("");
            e.currentTarget.blur();
          }
        }}
        placeholder="Add a task"
        aria-label="New task title"
        maxLength={200}
      />
      <input
        className="task-form-est"
        value={estimate}
        onChange={(e) => setEstimate(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
        inputMode="numeric"
        placeholder="min"
        aria-label="Estimate in minutes (optional)"
      />
      <button type="submit" className="pill pill-solid" disabled={!title.trim()}>
        Add
      </button>
    </form>
  );
});
