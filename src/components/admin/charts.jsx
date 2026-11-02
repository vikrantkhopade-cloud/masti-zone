// Recharts theme + small wrappers so every chart looks consistent.
import { formatDate, formatNumber } from '../../utils/format.js';

export const C = {
  aqua: '#08aecb',
  aquaLight: '#62e1f4',
  navy: '#163061',
  navyLight: '#7c9fcf',
  coral: '#ff8a6b',
  violet: '#8b5cf6',
  amber: '#f5a524',
  green: '#10b981',
  red: '#ef4444',
  grid: '#e7eef7',
  axis: '#7c9fcf',
};

export const GENDER_COLORS = { Male: C.navy, Female: C.aqua, Other: C.amber };
export const SERIES = [C.aqua, C.navy, C.coral, C.violet, C.amber, C.green, C.navyLight];

export const axisProps = { stroke: C.axis, fontSize: 12, tickLine: false, axisLine: false };
export const gridProps = { stroke: C.grid, strokeDasharray: '4 4', vertical: false };

export const shortDate = (d) => formatDate(d, { day: 'numeric', month: 'short' });

export function ChartTooltip({ active, payload, label, labelFormatter, valueFormatter = formatNumber }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl bg-navy-950 px-3.5 py-2.5 text-xs text-white shadow-2xl">
      {label !== undefined && <p className="mb-1.5 font-semibold text-navy-200">{labelFormatter ? labelFormatter(label) : label}</p>}
      {payload.map((p) => (
        <p key={p.dataKey || p.name} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.payload?.fill }} />
          <span className="text-navy-200">{p.name}:</span>
          <span className="font-semibold">{valueFormatter(p.value, p)}</span>
        </p>
      ))}
    </div>
  );
}

export function Legend({ items }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-navy-500">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full" style={{ background: i.color }} />{i.label}{i.value !== undefined && <span className="font-semibold text-navy-800">{i.value}</span>}</li>
      ))}
    </ul>
  );
}
