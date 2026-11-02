import { useMemo, useState } from 'react';
import { BellRing, Download, IndianRupee, ShoppingCart, TrendingDown } from 'lucide-react';
import { AdminPageHeader, DateRangeFilter, StatCard, useAdminFilters } from '../../components/admin/AdminUI.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import { BookingDetailsModal, bookingCsvColumns, bookingSearch, col } from '../../components/admin/bookingTable.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge from '../../components/ui/Badge.jsx';
import { Notice } from '../../components/ui/Misc.jsx';
import { useAnalytics, useRangeBookings } from '../../hooks/useAnalytics.js';
import { downloadCSV } from '../../utils/csv.js';
import { formatCompactINR, formatNumber, pct } from '../../utils/format.js';

export default function AbandonedBookings() {
  const { range } = useAdminFilters();
  const { data, loading, error, reload } = useRangeBookings({ statuses: ['abandoned'] });
  const analytics = useAnalytics();
  const [selected, setSelected] = useState(null);

  const stages = useMemo(() => {
    const m = {};
    (data || []).forEach((b) => { m[b.abandonedStage] = (m[b.abandonedStage] || 0) + 1; });
    return ['Visitor details', 'Checkout review', 'Payment'].map((s) => ({ stage: s, count: m[s] || 0 }));
  }, [data]);
  const total = data?.length || 0;
  const t = analytics.data?.totals;
  const rate = t ? pct(t.abandoned, t.abandoned + t.totalBookings) : 0;

  return (
    <>
      <AdminPageHeader title="Abandoned Bookings" subtitle="Customers who started booking but didn't complete payment — follow up to recover revenue." />
      <Notice tone="warn" className="mb-6">This reads real bookings data, but nothing currently writes an “abandoned” booking — the checkout flow only ever saves a booking once a guest submits it, so there is no mid-checkout drop-off tracking yet. This list will stay empty until that tracking is built (it would also need the <span className="font-mono">bookings</span> insert policy widened beyond <span className="font-mono">status = 'pending'</span>, which hasn't been changed).</Notice>
      <DateRangeFilter />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard loading={analytics.loading} icon={ShoppingCart} label="Abandoned bookings" value={formatNumber(t?.abandoned)} delta={analytics.data?.deltas.abandoned} tone="amber" invertDelta />
        <StatCard loading={analytics.loading} icon={IndianRupee} label="Potential revenue lost" value={formatCompactINR(t?.abandonedValue)} tone="red" />
        <StatCard loading={analytics.loading} icon={TrendingDown} label="Abandonment rate" value={`${rate}%`} tone="navy" hint="Of all booking attempts" />
      </div>

      <Card className="mb-6">
        <h3 className="font-semibold">Where customers drop off</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {stages.map((s) => (
            <div key={s.stage}>
              <div className="flex items-center justify-between text-sm"><span className="text-navy-600">{s.stage}</span><span className="font-semibold">{formatNumber(s.count)} · {pct(s.count, total)}%</span></div>
              <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-navy-50"><div className="h-full rounded-full bg-aqua-gradient transition-all duration-700" style={{ width: `${pct(s.count, total)}%` }} /></div>
            </div>
          ))}
        </div>
      </Card>

      <DataTable
        loading={loading} error={error} onRetry={reload} rows={data} onRowClick={setSelected}
        searchFn={bookingSearch} searchPlaceholder="Search name, phone…" emptyIcon={ShoppingCart} emptyTitle="No abandoned bookings" emptyDescription="Great — nobody dropped off in this period."
        columns={[col.id, col.customer, col.visit, col.plan, col.pax, col.total, { key: 'abandonedStage', header: 'Dropped at', render: (b) => <Badge tone="amber">{b.abandonedStage}</Badge> }, col.payment, col.created]}
        initialSort={{ key: 'createdAt', dir: 'desc' }}
        toolbar={(
          <>
            <Button size="sm" variant="secondary" disabled title="Automated reminders arrive with the backend (Phase 2)"><BellRing className="h-4 w-4" />Send reminders</Button>
            <Button size="sm" variant="outline" disabled={!total} onClick={() => downloadCSV(`abandoned_${range.from}_to_${range.to}`, data, [...bookingCsvColumns, { header: 'Dropped at', key: 'abandonedStage' }])}><Download className="h-4 w-4" />Export</Button>
          </>
        )}
      />
      <BookingDetailsModal booking={selected} onClose={() => setSelected(null)} />
    </>
  );
}
