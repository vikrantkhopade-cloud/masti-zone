import { useOutletContext } from 'react-router-dom';
import { ArrowDownRight, ArrowUpRight, CalendarRange } from 'lucide-react';
import Card from '../ui/Card.jsx';
import { DemoBadge } from '../ui/Misc.jsx';
import { Skeleton } from '../ui/StateViews.jsx';
import { DATE_PRESETS } from '../../utils/dates.js';
import { cn, formatDate } from '../../utils/format.js';

export const useAdminFilters = () => useOutletContext();

export function AdminPageHeader({ title, subtitle, actions, demo = false }) {
  return (
    <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-navy-900 sm:text-[28px]">{title}</h1>
          {demo && <DemoBadge />}
        </div>
        {subtitle && <p className="mt-1 text-sm text-navy-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function DateRangeFilter() {
  const { preset, setPreset, custom, setCustom, range } = useAdminFilters();
  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-card ring-1 ring-navy-100/70 xl:flex-row xl:items-center">
      <div className="flex gap-1 overflow-x-auto scrollbar-thin">
        {DATE_PRESETS.map((p) => (
          <button key={p.id} onClick={() => setPreset(p.id)} className={cn('whitespace-nowrap rounded-xl px-3.5 py-2 text-sm font-medium transition', preset === p.id ? 'bg-navy-900 text-white' : 'text-navy-500 hover:bg-navy-50 hover:text-navy-900')}>{p.label}</button>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2 xl:ml-auto">
        {preset === 'custom' ? (
          <>
            <input type="date" aria-label="From date" value={custom.from || range.from} max={custom.to || undefined} onChange={(e) => setCustom({ ...custom, from: e.target.value })} className="input-base h-10 w-auto py-1.5" />
            <span className="text-sm text-navy-400">to</span>
            <input type="date" aria-label="To date" value={custom.to || range.to} min={custom.from || undefined} onChange={(e) => setCustom({ ...custom, to: e.target.value })} className="input-base h-10 w-auto py-1.5" />
          </>
        ) : (
          <span className="flex items-center gap-2 rounded-xl bg-navy-50 px-3 py-2 text-sm font-medium text-navy-600"><CalendarRange className="h-4 w-4 text-aqua-500" />{formatDate(range.from)} – {formatDate(range.to)}</span>
        )}
      </div>
    </div>
  );
}

const TONES = {
  aqua: 'bg-aqua-50 text-aqua-600',
  navy: 'bg-navy-50 text-navy-700',
  green: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-500',
  violet: 'bg-violet-50 text-violet-600',
};

export function StatCard({ icon: Icon, label, value, delta, tone = 'aqua', hint, invertDelta = false, loading }) {
  if (loading) return <Card><Skeleton className="h-10 w-10 rounded-xl" /><Skeleton className="mt-4 h-4 w-24" /><Skeleton className="mt-2 h-7 w-32" /></Card>;
  const up = delta > 0;
  const good = invertDelta ? !up : up;
  return (
    <Card className="group relative overflow-hidden transition hover:-translate-y-0.5 hover:shadow-soft">
      <div className="flex items-start justify-between">
        <span className={cn('grid h-11 w-11 place-items-center rounded-xl', TONES[tone])}><Icon className="h-5 w-5" /></span>
        {delta !== null && delta !== undefined && (
          <span className={cn('inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold', good ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500')} title="vs previous period">
            {up ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}{Math.abs(delta)}%
          </span>
        )}
      </div>
      <p className="mt-4 text-sm font-medium text-navy-500">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold tracking-tight text-navy-900 sm:text-[28px]">{value}</p>
      {hint && <p className="mt-1 text-xs text-navy-400">{hint}</p>}
    </Card>
  );
}

export function ChartCard({ title, subtitle, action, children, className, height = 280, loading }) {
  return (
    <Card className={className}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-navy-900">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-navy-400">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div style={{ height }}>{loading ? <Skeleton className="h-full w-full rounded-xl" /> : children}</div>
    </Card>
  );
}

export function Segmented({ value, onChange, options }) {
  return (
    <div className="inline-flex rounded-xl bg-navy-50 p-1">
      {options.map((o) => (
        <button key={o.value} onClick={() => onChange(o.value)} className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold transition', value === o.value ? 'bg-white text-navy-900 shadow-sm' : 'text-navy-500 hover:text-navy-800')}>{o.label}</button>
      ))}
    </div>
  );
}
