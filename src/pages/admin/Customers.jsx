import { useMemo, useState } from 'react';
import { CalendarDays, Clock3, Download, Repeat, Ticket, UserPlus, UsersRound, Wallet } from 'lucide-react';
import { AdminPageHeader, StatCard } from '../../components/admin/AdminUI.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import Button from '../../components/ui/Button.jsx';
import Badge, { PaymentBadge, StatusBadge } from '../../components/ui/Badge.jsx';
import { Modal } from '../../components/ui/Misc.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/StateViews.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { adminService } from '../../services/adminService.js';
import { downloadCSV } from '../../utils/csv.js';
import { addDays, todayISO } from '../../utils/dates.js';
import { formatDate, formatINR, formatNumber, formatTime } from '../../utils/format.js';

function CustomerHistory({ customer, onClose }) {
  const { data, loading, error, reload } = useAsync(() => (customer ? adminService.getCustomerBookings(customer.id) : Promise.resolve([])), [customer?.id]);
  return (
    <Modal open={!!customer} onClose={onClose} title={customer ? `${customer.name}'s bookings` : ''} size="lg">
      {loading ? (
        <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data?.length ? (
        <EmptyState icon={Ticket} title="No bookings yet" description="This customer hasn't made a booking." />
      ) : (
        <ul className="divide-y divide-navy-50">
          {data.map((b) => (
            <li key={b.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-semibold text-navy-900">{b.id}<StatusBadge status={b.status} /><PaymentBadge status={b.paymentStatus} /></p>
                <p className="mt-1 flex items-center gap-3 text-xs text-navy-500"><span className="flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5" />{formatDate(b.visitDate)}</span><span className="flex items-center gap-1"><Clock3 className="h-3.5 w-3.5" />{formatTime(b.entryTime)}</span>{b.planLabel} · {b.quantity} pax</p>
              </div>
              <p className="font-display text-base font-bold text-navy-900">{formatINR(b.total)}</p>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

export default function Customers() {
  const { data, loading, error, reload } = useAsync(() => adminService.listCustomers(), []);
  const list = data || [];
  const [selected, setSelected] = useState(null);

  const stats = useMemo(() => {
    const active = list.filter((c) => c.bookings > 0);
    const repeat = active.filter((c) => c.bookings > 1).length;
    const spent = active.reduce((s, c) => s + c.spent, 0);
    const newThisMonth = list.filter((c) => c.joinedAt >= addDays(todayISO(), -30)).length;
    return { total: list.length, repeat, avg: active.length ? Math.round(spent / active.length) : 0, newThisMonth, activeCount: active.length };
  }, [list]);

  const tier = (c) => (c.spent >= 15000 ? ['violet', 'VIP'] : c.bookings > 2 ? ['aqua', 'Regular'] : c.bookings > 0 ? ['navy', 'Visitor'] : ['gray', 'No bookings']);

  return (
    <>
      <AdminPageHeader title="Customer Management" subtitle="All registered customers with lifetime booking value." />
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard loading={loading} icon={UsersRound} label="Total customers" value={formatNumber(stats.total)} tone="aqua" />
        <StatCard loading={loading} icon={Repeat} label="Repeat customers" value={formatNumber(stats.repeat)} hint={`of ${formatNumber(stats.activeCount)} who booked`} tone="navy" />
        <StatCard loading={loading} icon={Wallet} label="Avg lifetime spend" value={formatINR(stats.avg)} tone="green" />
        <StatCard loading={loading} icon={UserPlus} label="New (30 days)" value={formatNumber(stats.newThisMonth)} tone="violet" />
      </div>
      <DataTable
        loading={loading} error={error} onRetry={reload} rows={list} onRowClick={setSelected}
        searchFn={(c) => `${c.id} ${c.name} ${c.email} ${c.phone} ${c.city}`} searchPlaceholder="Search name, email, phone, city…"
        emptyIcon={UsersRound} emptyTitle="No customers yet"
        columns={[
          { key: 'name', header: 'Customer', render: (c) => <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-aqua-50 text-xs font-bold text-aqua-700">{c.name.split(' ').map((p) => p[0]).join('')}</span><div><p className="font-medium text-navy-800">{c.name}</p><p className="text-xs text-navy-400">{c.id}</p></div></div> },
          { key: 'email', header: 'Contact', render: (c) => <div><p>{c.email}</p><p className="text-xs text-navy-400">{c.phone}</p></div> },
          { key: 'city', header: 'City' },
          { key: 'bookings', header: 'Bookings', align: 'right' },
          { key: 'visitors', header: 'Visitors', align: 'right' },
          { key: 'spent', header: 'Lifetime value', align: 'right', render: (c) => <span className="font-semibold">{formatINR(c.spent)}</span> },
          { key: 'lastVisit', header: 'Last visit', render: (c) => formatDate(c.lastVisit) },
          { key: 'tier', header: 'Segment', sortable: false, render: (c) => { const [t, l] = tier(c); return <Badge tone={t}>{l}</Badge>; } },
        ]}
        toolbar={<Button size="sm" variant="outline" disabled={!list.length} onClick={() => downloadCSV('customers', list, [{ header: 'Customer ID', key: 'id' }, { header: 'Name', key: 'name' }, { header: 'Email', key: 'email' }, { header: 'Phone', key: 'phone' }, { header: 'City', key: 'city' }, { header: 'Joined', key: 'joinedAt' }, { header: 'Bookings', key: 'bookings' }, { header: 'Visitors', key: 'visitors' }, { header: 'Lifetime value (INR)', key: 'spent' }, { header: 'Last visit', key: 'lastVisit' }])}><Download className="h-4 w-4" />Export</Button>}
      />
      <CustomerHistory customer={selected} onClose={() => setSelected(null)} />
    </>
  );
}
