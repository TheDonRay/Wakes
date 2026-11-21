import { describe, expect, it } from "vitest";
import type { Session, Task } from "../types";
import {
  buildSessions,
  dailyFocus,
  dayProgress,
  focusSecondsOnDay,
  liveSessions,
  suggestNext,
  taskSeconds,
  tasksCompletedOnDay,
} from "./stats";

const ny = (y: number, mo: number, d: number, h = 0, mi = 0) => new Date(y, mo - 1, d, h, mi);
let n = 0;
const id = () => `s${n++}`;

function task(p: Partial<Task> & { id: string }): Task {
  return { title: p.id, status: "todo", createdAt: ny(2026, 11, 21, 8).toISOString(), ...p };
}

function session(taskId: string, start: Date, mins: number): Session {
  const end = new Date(start.getTime() + mins * 60_000);
  return { id: id(), taskId, startedAt: start.toISOString(), endedAt: end.toISOString(), durationSec: mins * 60 };
}

const TODAY = ny(2026, 11, 21, 15);

describe("buildSessions", () => {
  it("splits a run that crosses midnight into per-day sessions", () => {
    const s = buildSessions("a", ny(2026, 11, 20, 23, 40), ny(2026, 11, 21, 0, 20), id);
    expect(s).toHaveLength(2);
    expect(s.map((x) => x.durationSec)).toEqual([20 * 60, 20 * 60]);
    expect(focusSecondsOnDay(s, ny(2026, 11, 20))).toBe(20 * 60);
    expect(focusSecondsOnDay(s, ny(2026, 11, 21))).toBe(20 * 60);
  });

  it("drops zero-length runs", () => {
    expect(buildSessions("a", TODAY, TODAY, id)).toEqual([]);
  });
});

describe("focusSecondsOnDay", () => {
  it("is zero on an empty day", () => {
    expect(focusSecondsOnDay([], TODAY)).toBe(0);
  });

  it("sums several paused runs of one task", () => {
    // Pause/resume produces separate partial sessions; they all count.
    const s = [session("a", ny(2026, 11, 21, 9), 10), session("a", ny(2026, 11, 21, 9, 30), 15), session("b", ny(2026, 11, 20, 9), 60)];
    expect(focusSecondsOnDay(s, TODAY)).toBe(25 * 60);
    expect(taskSeconds(s, "a")).toBe(25 * 60);
  });

  it("includes a live running timer, split at midnight", () => {
    const live = liveSessions({ taskId: "a", startedAt: ny(2026, 11, 20, 23, 50).toISOString() }, ny(2026, 11, 21, 0, 5));
    expect(focusSecondsOnDay(live, ny(2026, 11, 21))).toBe(5 * 60);
    expect(focusSecondsOnDay(live, ny(2026, 11, 20))).toBe(10 * 60);
    expect(liveSessions(null, TODAY)).toEqual([]);
  });
});

describe("tasks done and completion rate", () => {
  it("handles a zero-task day", () => {
    expect(tasksCompletedOnDay([], TODAY)).toEqual([]);
    expect(dayProgress([], TODAY)).toEqual({ done: 0, total: 0, rate: null });
  });

  it("counts open + done-today, ignores tasks done on other days", () => {
    const tasks = [
      task({ id: "a", status: "done", completedAt: ny(2026, 11, 21, 10).toISOString() }),
      task({ id: "b" }),
      task({ id: "c", status: "in_progress" }),
      task({ id: "old", status: "done", createdAt: ny(2026, 11, 18).toISOString(), completedAt: ny(2026, 11, 19).toISOString() }),
    ];
    expect(tasksCompletedOnDay(tasks, TODAY).map((t) => t.id)).toEqual(["a"]);
    const p = dayProgress(tasks, TODAY);
    expect(p).toEqual({ done: 1, total: 3, rate: 1 / 3 });
  });

  it("finishing a task carried over from yesterday never exceeds 100%", () => {
    const tasks = [
      task({ id: "y", createdAt: ny(2026, 11, 20).toISOString(), status: "done", completedAt: ny(2026, 11, 21, 9).toISOString() }),
    ];
    expect(dayProgress(tasks, TODAY).rate).toBe(1);
  });

  it("uses local day for completedAt late in the evening", () => {
    // 23:30 New York on Nov 21 is Nov 22 in UTC.
    const t = task({ id: "a", status: "done", completedAt: ny(2026, 11, 21, 23, 30).toISOString() });
    expect(tasksCompletedOnDay([t], TODAY)).toHaveLength(1);
  });
});

describe("dailyFocus", () => {
  it("returns 7 days oldest-first, ending today, with gaps as zero", () => {
    const s = [session("a", ny(2026, 11, 21, 9), 30), session("a", ny(2026, 11, 19, 9), 60), session("a", ny(2026, 11, 10, 9), 99)];
    const week = dailyFocus(s, TODAY);
    expect(week).toHaveLength(7);
    expect(week[0].key).toBe("2026-11-15");
    expect(week[6]).toMatchObject({ key: "2026-11-21", seconds: 1800, isToday: true, label: "Sat" });
    expect(week[4].seconds).toBe(3600);
    expect(week.reduce((a, d) => a + d.seconds, 0)).toBe(5400);
  });

  it("spans the DST change without duplicating or skipping a day", () => {
    const week = dailyFocus([], ny(2026, 11, 4, 12));
    expect(week.map((d) => d.key)).toEqual([
      "2026-10-29", "2026-10-30", "2026-10-31", "2026-11-01", "2026-11-02", "2026-11-03", "2026-11-04",
    ]);
  });
});

describe("suggestNext", () => {
  it("picks the shortest remaining estimate, skipping done and running tasks", () => {
    const tasks = [
      task({ id: "long", estimateMin: 60 }),
      task({ id: "short", estimateMin: 20 }),
      task({ id: "running", estimateMin: 5 }),
      task({ id: "done", estimateMin: 1, status: "done" }),
      task({ id: "none" }),
    ];
    const s = [session("long", ny(2026, 11, 21, 9), 50)]; // 10m left on "long"
    expect(suggestNext(tasks, s, "running")).toMatchObject({ task: { id: "long" }, remainingMin: 10 });
  });

  it("falls back to the oldest task without an estimate", () => {
    const tasks = [
      task({ id: "newer", createdAt: ny(2026, 11, 21, 10).toISOString() }),
      task({ id: "older", createdAt: ny(2026, 11, 21, 9).toISOString() }),
    ];
    expect(suggestNext(tasks, [])?.task.id).toBe("older");
    expect(suggestNext([], [])).toBeNull();
  });
});
