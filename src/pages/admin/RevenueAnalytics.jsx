import { useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { IndianRupee, Receipt, RotateCcw, UserRound } from 'lucide-react';
import { AdminPageHeader, ChartCard, DateRangeFilter, Segmented, StatCard } from '../../components/admin/AdminUI.jsx';
import { C, ChartTooltip, axisProps, gridProps, shortDate } from '../../components/admin/charts.jsx';
import DonutChart from '../../components/admin/DonutChart.jsx';
import Card from '../../components/ui/Card.jsx';
import { ErrorState } from '../../components/ui/StateViews.jsx';
import { useAnalytics } from '../../hooks/useAnalytics.js';
import { formatCompactINR, formatINR, formatNumber, pct } from '../../utils/format.js';

export default function RevenueAnalytics() {
  const { data: a, loading, error, reload } = useAnalytics();
  const [grain, setGrain] = useState('daily');
  const perVisitor = a?.totals.totalVisitors ? Math.round(a.totals.revenue / a.totals.totalVisitors) : 0;

  return (
    <>
      <AdminPageHeader title="Revenue Analytics" subtitle="Paid revenue, ticket mix and payment methods." />
      <DateRangeFilter />
      {error ? <ErrorState error={error} onRetry={reload} /> : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard loading={loading} icon={IndianRupee} label="Gross revenue" value={formatCompactINR(a?.totals.revenue)} delta={a?.deltas.revenue} tone="green" hint={a && formatINR(a.totals.revenue)} />
            <StatCard loading={loading} icon={Receipt} label="Avg booking value" value={formatINR(a?.avgTicket)} tone="aqua" />
            <StatCard loading={loading} icon={UserRound} label="Revenue / visitor" value={formatINR(perVisitor)} tone="navy" />
            <StatCard loading={loading} icon={RotateCcw} label="Refunds issued" value={formatCompactINR(a?.totals.refunds)} tone="red" invertDelta delta={a?.deltas.refunds} />
          </div>

          <ChartCard loading={loading} title="Revenue trend" subtitle="Paid bookings, incl. GST" height={300} action={<Segmented value={grain} onChange={setGrain} options={[{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }]} />}>
            {a && (
              <ResponsiveContainer>
                {grain === 'daily' ? (
                  <AreaChart data={a.daily} margin={{ left: 0, top: 8 }}>
                    <defs><linearGradient id="rv" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.navy} stopOpacity={0.25} /><stop offset="100%" stopColor={C.navy} stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="date" {...axisProps} tickFormatter={shortDate} minTickGap={24} />
                    <YAxis {...axisProps} tickFormatter={formatCompactINR} />
                    <Tooltip content={<ChartTooltip labelFormatter={shortDate} valueFormatter={formatINR} />} />
                    <Area type="monotone" dataKey="revenue" name="Revenue" stroke={C.navy} strokeWidth={2.5} fill="url(#rv)" dot={a.days < 3} />
                  </AreaChart>
                ) : (
                  <BarChart data={a.weekly} margin={{ left: 0, top: 8 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="week" {...axisProps} tickFormatter={(w) => `Wk ${shortDate(w)}`} />
                    <YAxis {...axisProps} tickFormatter={formatCompactINR} />
                    <Tooltip cursor={{ fill: '#eef4fb' }} content={<ChartTooltip labelFormatter={(w) => `Week of ${shortDate(w)}`} valueFormatter={formatINR} />} />
                    <Bar dataKey="revenue" name="Revenue" fill={C.aqua} radius={[8, 8, 0, 0]} maxBarSize={56} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </ChartCard>

          <div className="grid gap-6 lg:grid-cols-3">
            <ChartCard loading={loading} className="lg:col-span-2" title="Revenue by ticket type" height={260}>
              {a && (
                <ResponsiveContainer>
                  <BarChart data={a.plans} margin={{ left: 0, top: 8 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="plan" {...axisProps} />
                    <YAxis {...axisProps} tickFormatter={formatCompactINR} />
                    <Tooltip cursor={{ fill: '#eef4fb' }} content={<ChartTooltip valueFormatter={formatINR} />} />
                    <Bar dataKey="revenue" name="Revenue" fill={C.aqua} radius={[8, 8, 0, 0]} maxBarSize={64} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
            <ChartCard loading={loading} title="Payment methods" height={260}>
              {a && <DonutChart data={a.paymentMethods.map((m) => ({ name: m.method, value: m.amount }))} centerLabel="collected" valueFormatter={formatCompactINR} />}
            </ChartCard>
          </div>

          {a && (
            <Card padded={false} className="overflow-hidden">
              <div className="border-b border-navy-50 px-6 py-4"><h3 className="font-semibold">Ticket performance</h3></div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="bg-navy-50/50 text-left text-xs uppercase tracking-wider text-navy-400">
                    <tr><th className="px-6 py-3">Ticket</th><th className="px-6 py-3 text-right">Bookings</th><th className="px-6 py-3 text-right">Visitors</th><th className="px-6 py-3 text-right">Revenue</th><th className="px-6 py-3">Share</th></tr>
                  </thead>
                  <tbody className="divide-y divide-navy-50">
                    {a.plans.map((p) => (
                      <tr key={p.plan}>
                        <td className="px-6 py-3 font-semibold">{p.plan}</td>
                        <td className="px-6 py-3 text-right">{formatNumber(p.bookings)}</td>
                        <td className="px-6 py-3 text-right">{formatNumber(p.visitors)}</td>
                        <td className="px-6 py-3 text-right font-semibold">{formatINR(p.revenue)}</td>
                        <td className="px-6 py-3"><div className="flex items-center gap-3"><div className="h-2 w-28 overflow-hidden rounded-full bg-navy-50"><div className="h-full rounded-full bg-aqua-gradient" style={{ width: `${pct(p.revenue, a.totals.revenue)}%` }} /></div><span className="text-xs text-navy-500">{pct(p.revenue, a.totals.revenue)}%</span></div></td>
                      </tr>
                    ))}
                    {a.plans.length === 0 && <tr><td colSpan={5} className="px-6 py-10 text-center text-navy-400">No paid bookings in this range.</td></tr>}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </>
  );
}
