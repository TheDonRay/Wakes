import { formatDuration, formatHeaderDate, greeting } from "../lib/time";
import { Icon } from "./Icon";

type Props = {
  now: Date;
  focusToday: number;
  openCount: number;
  onExport: (kind: "json" | "csv") => void;
  canExport: boolean;
};

export function Header({ now, focusToday, openCount, onExport, canExport }: Props) {
  const sub =
    focusToday > 0
      ? `${formatDuration(focusToday)} of focus so far.`
      : openCount > 0
        ? "Pick a task and start the clock."
        : "Add a task to get going.";
  return (
    <header className="page-head">
      <div>
        <p className="page-date">{formatHeaderDate(now)}</p>
        <h1 className="page-title">
          {greeting(now)}.
          <span className="page-sub">{sub}</span>
        </h1>
      </div>
      <div className="page-actions">
        <button
          type="button"
          className="pill"
          onClick={() => onExport("csv")}
          disabled={!canExport}
          title={canExport ? "Download today's sessions as CSV" : "No sessions today yet"}
        >
          <Icon name="download" size={14} /> CSV
        </button>
        <button
          type="button"
          className="pill"
          onClick={() => onExport("json")}
          disabled={!canExport}
          title={canExport ? "Download today's sessions as JSON" : "No sessions today yet"}
        >
          <Icon name="download" size={14} /> JSON
        </button>
      </div>
    </header>
  );
}
