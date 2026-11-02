import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartTooltip, SERIES } from './charts.jsx';
import { formatNumber, pct } from '../../utils/format.js';

/** Donut with a centre total and a percentage legend underneath. */
export default function DonutChart({ data, colors = {}, centerLabel = 'total', valueFormatter = formatNumber }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const colorOf = (d, i) => colors[d.name] || SERIES[i % SERIES.length];
  if (!total) return <div className="grid h-full place-items-center text-sm text-navy-400">No data in this range.</div>;
  return (
    <div className="flex h-full flex-col">
      <div className="relative min-h-0 flex-1">
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius="62%" outerRadius="92%" paddingAngle={3} stroke="none">
              {data.map((d, i) => <Cell key={d.name} fill={colorOf(d, i)} />)}
            </Pie>
            <Tooltip content={<ChartTooltip valueFormatter={(v) => `${valueFormatter(v)} (${pct(v, total)}%)`} />} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div><p className="font-display text-2xl font-bold">{valueFormatter(total)}</p><p className="text-xs text-navy-400">{centerLabel}</p></div>
        </div>
      </div>
      <div className="mt-3 grid gap-2 text-center" style={{ gridTemplateColumns: `repeat(${Math.min(data.length, 4)}, minmax(0, 1fr))` }}>
        {data.map((d, i) => (
          <div key={d.name} className="rounded-xl bg-navy-50/60 px-1 py-2">
            <p className="flex items-center justify-center gap-1.5 truncate text-xs text-navy-500"><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: colorOf(d, i) }} />{d.name}</p>
            <p className="font-semibold text-navy-900">{pct(d.value, total)}%</p>
          </div>
        ))}
      </div>
    </div>
  );
}
