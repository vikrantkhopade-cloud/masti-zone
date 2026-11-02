import { useMemo, useState } from 'react';
import { Ban, Download, Hourglass, RotateCcw } from 'lucide-react';
import { AdminPageHeader, DateRangeFilter, StatCard, useAdminFilters } from '../../components/admin/AdminUI.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import { BookingDetailsModal, bookingCsvColumns, bookingSearch, col } from '../../components/admin/bookingTable.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { useRangeBookings } from '../../hooks/useAnalytics.js';
import { downloadCSV } from '../../utils/csv.js';
import { formatCompactINR, formatINR, formatNumber, pct } from '../../utils/format.js';

export default function CancelledBookings() {
  const { range } = useAdminFilters();
  const { data, loading, error, reload } = useRangeBookings({ statuses: ['cancelled'] });
  const [selected, setSelected] = useState(null);
  const list = data || [];

  const reasons = useMemo(() => {
    const m = {};
    list.forEach((b) => { const r = b.cancelReason || 'Customer request'; m[r] = (m[r] || 0) + 1; });
    return Object.entries(m).map(([reason, count]) => ({ reason, count })).sort((a, b) => b.count - a.count);
  }, [list]);

  const refunded = list.filter((b) => b.paymentStatus === 'refunded').reduce((s, b) => s + (b.refundAmount || 0), 0);
  const pendingRefund = list.filter((b) => b.paymentStatus === 'refund_pending');

  return (
    <>
      <AdminPageHeader title="Cancelled Bookings" subtitle="Track cancellations, reasons and refunds." />
      <DateRangeFilter />
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <StatCard loading={loading} icon={Ban} label="Cancellations" value={formatNumber(list.length)} tone="red" />
        <StatCard loading={loading} icon={RotateCcw} label="Refunded" value={formatCompactINR(refunded)} tone="violet" />
        <StatCard loading={loading} icon={Hourglass} label="Refunds pending" value={formatNumber(pendingRefund.length)} tone="amber" hint={formatINR(pendingRefund.reduce((s, b) => s + b.refundAmount, 0))} />
      </div>

      {reasons.length > 0 && (
        <Card className="mb-6">
          <h3 className="font-semibold">Cancellation reasons</h3>
          <div className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
            {reasons.map((r) => (
              <div key={r.reason}>
                <div className="flex justify-between text-sm"><span className="text-navy-600">{r.reason}</span><span className="font-semibold">{r.count}</span></div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-navy-50"><div className="h-full rounded-full bg-coral-400" style={{ width: `${pct(r.count, list.length)}%` }} /></div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <DataTable
        loading={loading} error={error} onRetry={reload} rows={data} onRowClick={setSelected}
        searchFn={bookingSearch} emptyIcon={Ban} emptyTitle="No cancellations" emptyDescription="No bookings were cancelled in this period."
        columns={[col.id, col.customer, col.visit, col.plan, col.total, { key: 'cancelReason', header: 'Reason', render: (b) => b.cancelReason || 'Customer request' }, { key: 'refundAmount', header: 'Refund', align: 'right', render: (b) => formatINR(b.refundAmount || 0) }, col.payment]}
        initialSort={{ key: 'visitDate', dir: 'desc' }}
        toolbar={<Button size="sm" variant="outline" disabled={!list.length} onClick={() => downloadCSV(`cancelled_${range.from}_to_${range.to}`, list, [...bookingCsvColumns, { header: 'Reason', key: 'cancelReason' }, { header: 'Refund (INR)', key: 'refundAmount' }])}><Download className="h-4 w-4" />Export</Button>}
      />
      <BookingDetailsModal booking={selected} onClose={() => setSelected(null)} />
    </>
  );
}
