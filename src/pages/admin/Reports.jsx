import { useState } from 'react';
import { BarChart3, Ban, CalendarCheck2, CheckCircle2, CreditCard, FileSpreadsheet, ShoppingCart, UsersRound } from 'lucide-react';
import { AdminPageHeader, DateRangeFilter, useAdminFilters } from '../../components/admin/AdminUI.jsx';
import { bookingCsvColumns } from '../../components/admin/bookingTable.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { Notice } from '../../components/ui/Misc.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { adminService } from '../../services/adminService.js';
import { downloadCSV } from '../../utils/csv.js';
import { formatDate } from '../../utils/format.js';

const REPORTS = [
  { id: 'bookings', title: 'All bookings', icon: CalendarCheck2, desc: 'Every booking with status, visitors and amounts.' },
  { id: 'visitors', title: 'Visitor register', icon: UsersRound, desc: 'One row per visitor: name, age, gender, category, entry time.' },
  { id: 'daily', title: 'Daily summary', icon: BarChart3, desc: 'Visitors, bookings, revenue and cancellations per day.' },
  { id: 'payments', title: 'Payments', icon: CreditCard, desc: 'Payment status, method and transaction references.' },
  { id: 'cancelled', title: 'Cancellations & refunds', icon: Ban, desc: 'Cancelled bookings with reasons and refund amounts.' },
  { id: 'abandoned', title: 'Abandoned bookings', icon: ShoppingCart, desc: 'Incomplete bookings with contact info for follow-up.' },
];

export default function Reports() {
  const { range } = useAdminFilters();
  const { age } = useSettings();
  const [busy, setBusy] = useState(null);
  const [done, setDone] = useState(null);
  const [error, setError] = useState(null);

  const generate = async (id) => {
    setBusy(id); setError(null); setDone(null);
    try {
      const suffix = `${range.from}_to_${range.to}`;
      if (id === 'daily') {
        const a = await adminService.getAnalytics(range, age);
        downloadCSV(`daily_summary_${suffix}`, a.daily, [
          { header: 'Date', key: 'date' }, { header: 'Visitors', key: 'visitors' }, { header: 'Bookings', key: 'bookings' }, { header: 'Revenue (INR)', key: 'revenue' }, { header: 'Cancelled', key: 'cancelled' },
        ]);
      } else {
        const filters = { cancelled: { statuses: ['cancelled'] }, abandoned: { statuses: ['abandoned'] }, payments: {} }[id] || {};
        let rows = await adminService.listBookings({ range, ...filters });
        if (id === 'payments') rows = rows.filter((b) => b.transactionId || b.paymentStatus === 'pending');
        if (id === 'visitors') {
          const visitorRows = rows.filter((b) => b.status === 'confirmed').flatMap((b) => b.visitors.map((v, i) => ({ ...v, bookingId: b.id, n: i + 1, visitDate: b.visitDate, entryTime: b.entryTime, planLabel: b.planLabel, isDemo: b.isDemo })));
          downloadCSV(`visitor_register_${suffix}`, visitorRows, [
            { header: 'Booking ID', key: 'bookingId' }, { header: 'Data source', value: (r) => (r.isDemo ? 'DEMO' : 'Website test') }, { header: 'Visit date', key: 'visitDate' }, { header: 'Entry time', key: 'entryTime' }, { header: 'Ticket', key: 'planLabel' },
            { header: 'Visitor #', key: 'n' }, { header: 'Name', key: 'name' }, { header: 'Age', key: 'age' }, { header: 'Gender', key: 'gender' }, { header: 'Category', value: (r) => (r.age <= age.childMaxAge ? 'Child' : 'Adult') },
          ]);
        } else {
          const extra = id === 'cancelled' ? [{ header: 'Reason', key: 'cancelReason' }, { header: 'Refund (INR)', key: 'refundAmount' }] : id === 'abandoned' ? [{ header: 'Dropped at', key: 'abandonedStage' }] : [];
          downloadCSV(`${id}_${suffix}`, rows, [...bookingCsvColumns, ...extra]);
        }
      }
      setDone(id);
    } catch (e) {
      setError(e);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <AdminPageHeader title="Excel Reports" subtitle="Download reports for the selected date range — opens directly in Microsoft Excel or Google Sheets." />
      <DateRangeFilter />
      <Notice className="mb-6">Reports are exported as Excel-compatible CSV files. Demo rows are labelled “DEMO” in the <em>Data source</em> column. Native .xlsx with formatting can be added with the backend.</Notice>
      {error && <Notice tone="warn" className="mb-6" title="Export failed">{error.message}</Notice>}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {REPORTS.map(({ id, title, icon: Icon, desc }) => (
          <Card key={id} className="flex flex-col transition hover:-translate-y-0.5 hover:shadow-soft">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-600"><FileSpreadsheet className="h-6 w-6" /></span>
              <div>
                <h3 className="flex items-center gap-2 font-semibold"><Icon className="h-4 w-4 text-aqua-500" />{title}</h3>
                <p className="mt-1 text-sm text-navy-500">{desc}</p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between border-t border-navy-50 pt-4">
              <span className="text-xs text-navy-400">{formatDate(range.from)} – {formatDate(range.to)}</span>
              {done === id ? (
                <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600"><CheckCircle2 className="h-4 w-4" />Downloaded</span>
              ) : (
                <Button size="sm" variant="navy" loading={busy === id} disabled={!!busy && busy !== id} onClick={() => generate(id)}>Download</Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
