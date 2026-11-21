import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyFocus } from "../lib/stats";
import { formatDuration } from "../lib/time";

type TooltipProps = { active?: boolean; payload?: { payload: DailyFocus }[] };

function ChartTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="chart-tip">
      <span>{d.isToday ? "Today" : d.label}</span>
      <strong>{formatDuration(d.seconds)}</strong>
    </div>
  );
}

export function WeeklyChart({ data }: { data: DailyFocus[] }) {
  const total = data.reduce((s, d) => s + d.seconds, 0);
  const avg = total / data.length;
  const maxH = Math.max(...data.map((d) => d.seconds / 3600));
  const top = maxH <= 1 ? 1 : Math.ceil(maxH);
  const chartData = data.map((d) => ({ ...d, hours: d.seconds / 3600 }));

  return (
    <div className="chart">
      <div className="chart-summary">
        <div>
          <p className="stat-label">This week</p>
          <p className="chart-total">{formatDuration(total)}</p>
        </div>
        <div>
          <p className="stat-label">Daily avg</p>
          <p className="chart-total muted">{formatDuration(avg)}</p>
        </div>
      </div>
      <div className="chart-frame" role="img" aria-label={`Focus time for the last 7 days. ${data.map((d) => `${d.label} ${formatDuration(d.seconds)}`).join(", ")}.`}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 8, right: 0, bottom: 0, left: -18 }} barCategoryGap="22%">
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: "var(--border)" }}
              tick={{ fill: "var(--text-muted)", fontSize: 12 }}
            />
            <YAxis
              domain={[0, top]}
              tickCount={top <= 1 ? 3 : Math.min(top + 1, 5)}
              tickFormatter={(v: number) => (top <= 1 ? `${Math.round(v * 60)}m` : `${v}h`)}
              tickLine={false}
              axisLine={false}
              tick={{ fill: "var(--text-muted)", fontSize: 11 }}
              allowDecimals
            />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="hours" radius={[6, 6, 2, 2]} minPointSize={2} isAnimationActive={false}>
              {chartData.map((d) => (
                <Cell key={d.key} fill={d.isToday ? "var(--accent)" : "var(--bar)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
