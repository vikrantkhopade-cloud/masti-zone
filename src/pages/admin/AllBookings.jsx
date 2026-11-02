import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { AdminPageHeader, DateRangeFilter, useAdminFilters } from '../../components/admin/AdminUI.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import { BookingDetailsModal, bookingCsvColumns, bookingSearch, col } from '../../components/admin/bookingTable.jsx';
import Button from '../../components/ui/Button.jsx';
import { useRangeBookings } from '../../hooks/useAnalytics.js';
import { downloadCSV } from '../../utils/csv.js';
import { cn, formatNumber } from '../../utils/format.js';

const STATUS_TABS = [
  { id: 'all', label: 'All' },
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'pending', label: 'Pending' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'abandoned', label: 'Abandoned' },
];

export default function AllBookings() {
  const { range } = useAdminFilters();
  const { data, loading, error, reload } = useRangeBookings();
  const [status, setStatus] = useState('all');
  const [selected, setSelected] = useState(null);

  const counts = useMemo(() => {
    const c = { all: data?.length || 0 };
    (data || []).forEach((b) => { c[b.status] = (c[b.status] || 0) + 1; });
    return c;
  }, [data]);
  const rows = useMemo(() => (status === 'all' ? data : (data || []).filter((b) => b.status === status)), [data, status]);

  return (
    <>
      <AdminPageHeader title="All Bookings" subtitle="Search, filter and inspect every booking." />
      <DateRangeFilter />
      <DataTable
        loading={loading} error={error} onRetry={reload} rows={rows}
        columns={[col.id, col.customer, col.visit, col.plan, col.pax, col.total, col.status, col.payment, col.created]}
        searchFn={bookingSearch} searchPlaceholder="Search ID, name, phone…" onRowClick={setSelected}
        initialSort={{ key: 'createdAt', dir: 'desc' }}
        toolbar={(
          <>
            <div className="flex flex-wrap gap-1">
              {STATUS_TABS.map((t) => (
                <button key={t.id} onClick={() => setStatus(t.id)} className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold transition', status === t.id ? 'bg-navy-900 text-white' : 'bg-navy-50 text-navy-500 hover:text-navy-800')}>
                  {t.label} <span className="opacity-60">{formatNumber(counts[t.id] || 0)}</span>
                </button>
              ))}
            </div>
            <Button size="sm" variant="outline" disabled={!rows?.length} onClick={() => downloadCSV(`bookings_${range.from}_to_${range.to}`, rows, bookingCsvColumns)}><Download className="h-4 w-4" />Export</Button>
          </>
        )}
      />
      <BookingDetailsModal booking={selected} onClose={() => setSelected(null)} />
    </>
  );
}
