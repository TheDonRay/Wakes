import type { ReactNode } from "react";

type Props = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  /** 0..1 progress shown as a thin bar under the value. */
  meter?: number | null;
};

export function StatCard({ label, value, detail, meter }: Props) {
  return (
    <section className="stat" aria-label={label}>
      <p className="stat-label">{label}</p>
      <p className="stat-value">{value}</p>
      {meter != null ? (
        <div className="meter" aria-hidden="true">
          <span style={{ width: `${Math.round(Math.min(1, Math.max(0, meter)) * 100)}%` }} />
        </div>
      ) : null}
      {detail ? <p className="stat-detail">{detail}</p> : null}
    </section>
  );
}
