import { describe, expect, it } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

function openList() {
  return screen.getByRole("list", { name: "Open tasks" });
}

describe("App", () => {
  it("adds a task with Enter and completes it", async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText("Nothing on the list.")).toBeInTheDocument();

    await user.type(screen.getByLabelText("New task title"), "Write docs{Enter}");
    expect(within(openList()).getByText("Write docs")).toBeInTheDocument();
    expect(screen.getByLabelText("New task title")).toHaveValue("");

    await user.click(screen.getByRole("button", { name: 'Mark "Write docs" as done' }));

    const done = screen.getByRole("list", { name: "Done tasks" });
    expect(within(done).getByText("Write docs")).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Done today" })).toHaveTextContent("1/1");
    expect(screen.getByRole("region", { name: "Completion rate" })).toHaveTextContent("100%");

    // Persisted through the storage module.
    const stored = JSON.parse(localStorage.getItem("fd.tasks")!);
    expect(stored[0]).toMatchObject({ title: "Write docs", status: "done" });
    expect(stored[0].completedAt).toBeTruthy();
  });

  it("only one timer runs; switching tasks saves the previous session", async () => {
    const user = userEvent.setup();
    const created = new Date(Date.now() - 3_600_000).toISOString();
    localStorage.setItem(
      "fd.tasks",
      JSON.stringify([
        { id: "a", title: "A", status: "in_progress", createdAt: created },
        { id: "b", title: "B", status: "todo", createdAt: created },
      ]),
    );
    // A has been running for 2 minutes.
    localStorage.setItem("fd.activeTimer", JSON.stringify({ taskId: "a", startedAt: new Date(Date.now() - 120_000).toISOString() }));
    render(<App />);
    expect(screen.getByRole("button", { name: 'Pause "A"' })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: 'Start "B"' }));

    expect(screen.queryByRole("button", { name: 'Pause "A"' })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: 'Resume "A"' })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: 'Pause "B"' })).toBeInTheDocument();

    const sessions = JSON.parse(localStorage.getItem("fd.sessions")!);
    expect(sessions).toHaveLength(1);
    expect(sessions[0].taskId).toBe("a");
    expect(sessions[0].durationSec).toBeGreaterThanOrEqual(120);
    expect(JSON.parse(localStorage.getItem("fd.activeTimer")!).taskId).toBe("b");
  });

  it("Finish ends a running task early and keeps the time worked", async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      "fd.tasks",
      JSON.stringify([{ id: "a", title: "A", status: "in_progress", estimateMin: 60, createdAt: new Date(Date.now() - 3_600_000).toISOString() }]),
    );
    localStorage.setItem("fd.activeTimer", JSON.stringify({ taskId: "a", startedAt: new Date(Date.now() - 10 * 60_000).toISOString() }));
    render(<App />);

    const row = within(openList()).getByText("A").closest("li")!;
    await user.click(within(row).getByRole("button", { name: 'Finish "A"' }));

    expect(within(screen.getByRole("list", { name: "Done tasks" })).getByText("A")).toBeInTheDocument();
    expect(localStorage.getItem("fd.activeTimer")).toBeNull();
    const sessions = JSON.parse(localStorage.getItem("fd.sessions")!);
    expect(sessions[0].durationSec).toBeGreaterThanOrEqual(600);
    expect(JSON.parse(localStorage.getItem("fd.tasks")!)[0].status).toBe("done");
  });

  it("restores a running timer after a refresh and shows elapsed time", () => {
    const now = Date.now();
    localStorage.setItem(
      "fd.tasks",
      JSON.stringify([{ id: "t1", title: "Fix layout bug", status: "in_progress", createdAt: new Date(now - 3_600_000).toISOString() }]),
    );
    localStorage.setItem("fd.activeTimer", JSON.stringify({ taskId: "t1", startedAt: new Date(now - 45 * 60_000 - 10_000).toISOString() }));

    render(<App />);
    const row = within(openList()).getByText("Fix layout bug").closest("li")!;
    expect(row).toHaveClass("is-running");
    expect(within(row).getByText(/^00:45:1\d$/)).toBeInTheDocument();
  });

  it("deleting asks for confirmation and removes the task's sessions", async () => {
    const user = userEvent.setup();
    localStorage.setItem("fd.tasks", JSON.stringify([{ id: "t1", title: "Temp", status: "todo", createdAt: new Date().toISOString() }]));
    localStorage.setItem(
      "fd.sessions",
      JSON.stringify([{ id: "s1", taskId: "t1", startedAt: new Date().toISOString(), endedAt: new Date().toISOString(), durationSec: 60 }]),
    );
    render(<App />);

    await user.click(screen.getByRole("button", { name: 'Delete "Temp"' }));
    expect(within(openList()).getByText("Temp")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: 'Confirm delete "Temp"' }));
    expect(screen.queryByText("Temp")).not.toBeInTheDocument();
    expect(screen.getByText("Nothing on the list.")).toBeInTheDocument();
    await act(async () => {});
    expect(JSON.parse(localStorage.getItem("fd.sessions")!)).toEqual([]);
  });

  it("edits a task inline; Escape cancels", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.type(screen.getByLabelText("New task title"), "Draft{Enter}");

    await user.click(screen.getByRole("button", { name: 'Edit "Draft"' }));
    await user.type(screen.getByLabelText("Task title"), " nope{Escape}");
    expect(within(openList()).getByText("Draft")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: 'Edit "Draft"' }));
    const input = screen.getByLabelText("Task title");
    await user.clear(input);
    await user.type(input, "Final{Enter}");
    expect(within(openList()).getByText("Final")).toBeInTheDocument();
  });
});
