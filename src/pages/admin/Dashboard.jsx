import { Link } from 'react-router-dom';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { ArrowRight, Ban, CalendarCheck2, CalendarClock, CheckCircle2, Clock4, IndianRupee, UsersRound, Users } from 'lucide-react';
import { AdminPageHeader, ChartCard, DateRangeFilter, StatCard } from '../../components/admin/AdminUI.jsx';
import { C, ChartTooltip, GENDER_COLORS, Legend, axisProps, gridProps, shortDate } from '../../components/admin/charts.jsx';
import DonutChart from '../../components/admin/DonutChart.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { PaymentBadge } from '../../components/ui/Badge.jsx';
import { ErrorState, Skeleton } from '../../components/ui/StateViews.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { useAnalytics, useRangeBookings } from '../../hooks/useAnalytics.js';
import { adminService } from '../../services/adminService.js';
import { formatCompactINR, formatINR, formatNumber, formatTime } from '../../utils/format.js';

export default function Dashboard() {
  const { data: a, loading, error, reload } = useAnalytics();
  const recent = useRangeBookings();
  const today = useAsync(() => adminService.getTodayBookingsCount(), []);
  const customers = useAsync(() => adminService.getTotalCustomersCount(), []);

  return (
    <>
      <AdminPageHeader title="Dashboard" subtitle="Live overview of visitors, bookings and revenue." actions={<Button to="/admin/reports" variant="outline" size="sm">Export report</Button>} />
      <DateRangeFilter />

      {error ? <ErrorState error={error} onRetry={reload} /> : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 2xl:grid-cols-8">
            <StatCard loading={loading} icon={Users} label="Total Visitors" value={formatNumber(a?.totals.totalVisitors)} delta={a?.deltas.totalVisitors} tone="aqua" />
            <StatCard loading={loading} icon={CalendarCheck2} label="Total Bookings" value={formatNumber(a?.totals.totalBookings)} delta={a?.deltas.totalBookings} tone="navy" />
            <StatCard loading={today.loading} icon={CalendarClock} label="Today's Bookings" value={formatNumber(today.data)} tone="aqua" hint="Visit date: today" />
            <StatCard loading={customers.loading} icon={UsersRound} label="Total Customers" value={formatNumber(customers.data)} tone="violet" hint="Registered accounts" />
            <StatCard loading={loading} icon={IndianRupee} label="Total Revenue" value={formatCompactINR(a?.totals.revenue)} delta={a?.deltas.revenue} tone="green" hint={a && `Avg ${formatINR(a.avgTicket)} / booking`} />
            <StatCard loading={loading} icon={CheckCircle2} label="Confirmed Bookings" value={formatNumber(a?.totals.confirmedBookings)} delta={a?.deltas.confirmedBookings} tone="violet" />
            <StatCard loading={loading} icon={Clock4} label="Pending Bookings" value={formatNumber(a?.totals.pendingBookings)} delta={a?.deltas.pendingBookings} tone="amber" invertDelta />
            <StatCard loading={loading} icon={Ban} label="Cancelled Bookings" value={formatNumber(a?.totals.cancelled)} delta={a?.deltas.cancelled} tone="red" invertDelta />
          </div>

          <div className="grid gap-6 xl:grid-cols-12">
            <ChartCard loading={loading} className="xl:col-span-8" title="Daily visitors & revenue" subtitle="Confirmed visitors and paid revenue per day" height={300}
              action={<Legend items={[{ label: 'Visitors', color: C.aqua }, { label: 'Revenue', color: C.navy }]} />}>
              {a && (
                <ResponsiveContainer>
                  <AreaChart data={a.daily} margin={{ left: -10, right: 4, top: 8 }}>
                    <defs>
                      <linearGradient id="gV" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.aqua} stopOpacity={0.35} /><stop offset="100%" stopColor={C.aqua} stopOpacity={0} /></linearGradient>
                      <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={C.navy} stopOpacity={0.18} /><stop offset="100%" stopColor={C.navy} stopOpacity={0} /></linearGradient>
                    </defs>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="date" {...axisProps} tickFormatter={shortDate} minTickGap={24} />
                    <YAxis yAxisId="v" {...axisProps} />
                    <YAxis yAxisId="r" orientation="right" {...axisProps} tickFormatter={(v) => formatCompactINR(v)} />
                    <Tooltip content={<ChartTooltip labelFormatter={shortDate} valueFormatter={(v, p) => (p.dataKey === 'revenue' ? formatINR(v) : formatNumber(v))} />} />
                    <Area yAxisId="r" type="monotone" dataKey="revenue" name="Revenue" stroke={C.navy} strokeWidth={2} fill="url(#gR)" dot={a.days < 3} />
                    <Area yAxisId="v" type="monotone" dataKey="visitors" name="Visitors" stroke={C.aqua} strokeWidth={2.5} fill="url(#gV)" dot={a.days < 3} />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <ChartCard loading={loading} className="xl:col-span-4" title="Gender-wise visitors" subtitle="Share of confirmed visitors" height={300}>
              {a && <DonutChart data={a.gender} colors={GENDER_COLORS} centerLabel="visitors" />}
            </ChartCard>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ChartCard loading={loading} title="Hour-wise visitor entry" subtitle="Visitors by entry time slot" height={260}>
              {a && (
                <ResponsiveContainer>
                  <BarChart data={a.hourly} margin={{ left: -16, top: 8 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="hour" {...axisProps} />
                    <YAxis {...axisProps} />
                    <Tooltip cursor={{ fill: '#eef4fb' }} content={<ChartTooltip />} />
                    <Bar dataKey="visitors" name="Visitors" radius={[8, 8, 0, 0]} maxBarSize={42}>
                      {a.hourly.map((h, i) => <Cell key={i} fill={h.visitors === Math.max(...a.hourly.map((x) => x.visitors)) ? C.navy : C.aqua} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
            <ChartCard loading={loading} title="Age-wise visitors" subtitle="Confirmed visitors by age group" height={260}>
              {a && (
                <ResponsiveContainer>
                  <BarChart data={a.ageGroups} margin={{ left: -16, top: 8 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="group" {...axisProps} />
                    <YAxis {...axisProps} />
                    <Tooltip cursor={{ fill: '#eef4fb' }} content={<ChartTooltip />} />
                    <Bar dataKey="visitors" name="Visitors" fill={C.aqua} radius={[8, 8, 0, 0]} maxBarSize={42} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>
          </div>

          <div className="grid gap-6 xl:grid-cols-12">
            <ChartCard loading={loading} className="xl:col-span-7" title="Weekly analytics" subtitle="Average visitors by day of week" height={260}>
              {a && (
                <ResponsiveContainer>
                  <BarChart data={a.weekday} margin={{ left: -16, top: 8 }}>
                    <CartesianGrid {...gridProps} />
                    <XAxis dataKey="day" {...axisProps} />
                    <YAxis {...axisProps} />
                    <Tooltip cursor={{ fill: '#eef4fb' }} content={<ChartTooltip />} />
                    <Bar dataKey="avgVisitors" name="Avg visitors" radius={[8, 8, 0, 0]} maxBarSize={48}>
                      {a.weekday.map((d) => <Cell key={d.day} fill={d.day === 'Sat' || d.day === 'Sun' ? C.navy : C.aquaLight} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </ChartCard>

            <Card className="xl:col-span-5">
              <div className="mb-4 flex items-center justify-between">
                <div><h3 className="font-semibold text-navy-900">Recent bookings</h3><p className="text-xs text-navy-400">Latest in selected range</p></div>
                <Link to="/admin/bookings" className="flex items-center gap-1 text-sm font-semibold text-aqua-600 hover:underline">View all<ArrowRight className="h-4 w-4" /></Link>
              </div>
              {recent.loading ? (
                <div className="space-y-3">{[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-12" />)}</div>
              ) : recent.error ? <ErrorState error={recent.error} onRetry={recent.reload} /> : (
                <ul className="divide-y divide-navy-50">
                  {(recent.data || []).slice(0, 6).map((b) => (
                    <li key={b.id} className="flex items-center gap-3 py-2.5">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-aqua-50 text-xs font-bold text-aqua-700">{b.customerName.split(' ').map((p) => p[0]).join('').slice(0, 2)}</span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-navy-800">{b.customerName}</p>
                        <p className="text-xs text-navy-400">{b.id} · {b.quantity} pax · {formatTime(b.entryTime)}</p>
                      </div>
                      <div className="text-right"><p className="text-sm font-semibold">{formatINR(b.total)}</p><PaymentBadge status={b.paymentStatus} /></div>
                    </li>
                  ))}
                  {recent.data?.length === 0 && <li className="py-8 text-center text-sm text-navy-400">No bookings in this range.</li>}
                </ul>
              )}
            </Card>
          </div>
        </div>
      )}
    </>
  );
}
