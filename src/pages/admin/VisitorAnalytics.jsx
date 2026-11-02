import { useState } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Baby, Clock3, UsersRound, UserRoundCheck } from 'lucide-react';
import { AdminPageHeader, ChartCard, DateRangeFilter, Segmented, StatCard } from '../../components/admin/AdminUI.jsx';
import { C, ChartTooltip, GENDER_COLORS, axisProps, gridProps, shortDate } from '../../components/admin/charts.jsx';
import DonutChart from '../../components/admin/DonutChart.jsx';
import { ErrorState } from '../../components/ui/StateViews.jsx';
import { useAnalytics } from '../../hooks/useAnalytics.js';
import { formatNumber, pct } from '../../utils/format.js';

export default function VisitorAnalytics() {
  const { data: a, loading, error, reload } = useAnalytics();
  const [grain, setGrain] = useState('daily');

  const peak = a?.hourly.reduce((m, h) => (h.visitors > m.visitors ? h : m), { visitors: -1 });
  const childShare = a ? pct(a.category[0].value, a.category[0].value + a.category[1].value) : 0;
  const series = grain === 'daily' ? a?.daily : a?.weekly;
  const xKey = grain === 'daily' ? 'date' : 'week';

  return (
    <>
      <AdminPageHeader title="Visitor Analytics" subtitle="Footfall patterns by day, hour, gender and age." />
      <DateRangeFilter />
      {error ? <ErrorState error={error} onRetry={reload} /> : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard loading={loading} icon={UsersRound} label="Total visitors" value={formatNumber(a?.totals.totalVisitors)} delta={a?.deltas.totalVisitors} />
            <StatCard loading={loading} icon={UserRoundCheck} label="Avg visitors / day" value={formatNumber(a ? a.totals.totalVisitors / a.days : 0)} tone="navy" hint={a && `Avg group size ${a.avgGroup}`} />
            <StatCard loading={loading} icon={Clock3} label="Peak entry hour" value={peak?.hour || '—'} tone="amber" hint={peak && `${formatNumber(peak.visitors)} visitors`} />
            <StatCard loading={loading} icon={Baby} label="Children share" value={`${childShare}%`} tone="violet" />
          </div>

          <ChartCard loading={loading} title={grain === 'daily' ? 'Daily visitors' : 'Weekly visitors'} subtitle="Confirmed visitors" height={300} action={<Segmented value={grain} onChange={setGrain} options={[{ value: 'daily', label: 'Daily' }, { value: 'weekly', label: 'Weekly' }]} />}>
            {a && (
              <ResponsiveContainer>
                {grain === 'daily' ? (
                  <AreaChart data={series} margin={{ left: -10, top: 8 }}>
                    <defs><linearGradient id="va" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.aqua} stopOpacity={0.35} /><stop offset="100%" stopColor={C.aqua} stopOpacity={0} /></linearGradient></defs>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey={xKey} {...axisProps} tickFormatter={shortDate} minTickGap={24} />
                    <YAxis {...axisProps} />
                    <Tooltip content={<ChartTooltip labelFormatter={shortDate} />} />
                    <Area type="monotone" dataKey="visitors" name="Visitors" stroke={C.aqua} strokeWidth={2.5} fill="url(#va)" dot={a.days < 3} />
                  </AreaChart>
                ) : (
                  <BarChart data={series} margin={{ left: -10, top: 8 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey={xKey} {...axisProps} tickFormatter={(w) => `Wk ${shortDate(w)}`} />
                    <YAxis {...axisProps} />
                    <Tooltip cursor={{ fill: '#eef4fb' }} content={<ChartTooltip labelFormatter={(w) => `Week of ${shortDate(w)}`} />} />
                    <Bar dataKey="visitors" name="Visitors" fill={C.navy} radius={[8, 8, 0, 0]} maxBarSize={56} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </ChartCard>

          <div className="grid gap-6 lg:grid-cols-3">
            <ChartCard loading={loading} className="lg:col-span-2" title="Hour-wise entries" subtitle="Visitors and bookings by entry slot" height={260}>
              {a && (
                <ResponsiveContainer>
                  <BarChart data={a.hourly} margin={{ left: -16, top: 8 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="hour" {...axisProps} />
                    <YAxis {...axisProps} />
                    <Tooltip cursor={{ fill: '#eef4fb' }} content={<ChartTooltip />} />
                    <Bar dataKey="visitors" name="Visitors" fill={C.aqua} radius={[6, 6, 0, 0]} maxBarSize={32} />
                    <Bar dataKey="bookings" name="Bookings" fill={C.navy} radius={[6, 6, 0, 0]} maxBarSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
            <ChartCard loading={loading} title="Gender split" height={260}>{a && <DonutChart data={a.gender} colors={GENDER_COLORS} centerLabel="visitors" />}</ChartCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <ChartCard loading={loading} className="lg:col-span-2" title="Age groups" subtitle="Confirmed visitors by age" height={260}>
              {a && (
                <ResponsiveContainer>
                  <BarChart data={a.ageGroups} layout="vertical" margin={{ left: 0, right: 16 }}>
                    <CartesianGrid {...gridProps} horizontal={false} vertical />
                    <XAxis type="number" {...axisProps} />
                    <YAxis type="category" dataKey="group" {...axisProps} width={48} />
                    <Tooltip cursor={{ fill: '#eef4fb' }} content={<ChartTooltip />} />
                    <Bar dataKey="visitors" name="Visitors" radius={[0, 8, 8, 0]} maxBarSize={24}>
                      {a.ageGroups.map((g, i) => <Cell key={g.group} fill={i < 2 ? C.violet : C.aqua} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
            <ChartCard loading={loading} title="Child vs adult" subtitle="Based on current age settings" height={260}>{a && <DonutChart data={a.category} colors={{ Children: C.violet, Adults: C.aqua }} centerLabel="visitors" />}</ChartCard>
          </div>

          <ChartCard loading={loading} title="Day-of-week pattern" subtitle="Average visitors per weekday" height={220}>
            {a && (
              <ResponsiveContainer>
                <BarChart data={a.weekday} margin={{ left: -16, top: 8 }}>
                  <CartesianGrid {...gridProps} />
                  <XAxis dataKey="day" {...axisProps} />
                  <YAxis {...axisProps} />
                  <Tooltip cursor={{ fill: '#eef4fb' }} content={<ChartTooltip />} />
                  <Bar dataKey="avgVisitors" name="Avg visitors" radius={[8, 8, 0, 0]} maxBarSize={56}>
                    {a.weekday.map((d) => <Cell key={d.day} fill={d.day === 'Sat' || d.day === 'Sun' ? C.navy : C.aquaLight} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>
      )}
    </>
  );
}
