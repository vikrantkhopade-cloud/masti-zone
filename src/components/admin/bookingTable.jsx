import { CalendarDays, Clock3, Mail, Phone, Ticket } from 'lucide-react';
import Badge, { PaymentBadge, StatusBadge } from '../ui/Badge.jsx';
import { Modal, DemoBadge } from '../ui/Misc.jsx';
import { formatDate, formatDateTime, formatINR, formatTime } from '../../utils/format.js';

export const bookingSearch = (b) => `${b.id} ${b.customerName} ${b.email} ${b.phone} ${b.planLabel}`;

export const col = {
  id: { key: 'id', header: 'Booking ID', render: (b) => <span className="font-semibold text-navy-900">{b.id}{!b.isDemo && <Badge tone="aqua" className="ml-2">Website</Badge>}</span> },
  customer: { key: 'customerName', header: 'Customer', render: (b) => <div><p className="font-medium text-navy-800">{b.customerName}</p><p className="text-xs text-navy-400">{b.phone}</p></div> },
  visit: { key: 'visitDate', header: 'Visit', render: (b) => <div><p>{formatDate(b.visitDate)}</p><p className="text-xs text-navy-400">{formatTime(b.entryTime)}</p></div> },
  plan: { key: 'planLabel', header: 'Ticket' },
  pax: { key: 'quantity', header: 'Visitors', align: 'right', render: (b) => <span>{b.quantity} <span className="text-xs text-navy-400">({b.adultCount}A · {b.childCount}C)</span></span> },
  total: { key: 'total', header: 'Amount', align: 'right', render: (b) => <span className="font-semibold text-navy-900">{formatINR(b.total)}</span> },
  status: { key: 'status', header: 'Status', render: (b) => <StatusBadge status={b.status} /> },
  payment: { key: 'paymentStatus', header: 'Payment', render: (b) => <PaymentBadge status={b.paymentStatus} /> },
  created: { key: 'createdAt', header: 'Created', render: (b) => <span className="text-navy-500">{formatDateTime(b.createdAt)}</span> },
};

export const bookingCsvColumns = [
  { header: 'Booking ID', key: 'id' },
  { header: 'Data source', value: (b) => (b.isDemo ? 'DEMO' : 'Website test') },
  { header: 'Customer', key: 'customerName' },
  { header: 'Email', key: 'email' },
  { header: 'Phone', key: 'phone' },
  { header: 'Visit date', key: 'visitDate' },
  { header: 'Entry time', key: 'entryTime' },
  { header: 'Ticket', key: 'planLabel' },
  { header: 'Visitors', key: 'quantity' },
  { header: 'Adults', key: 'adultCount' },
  { header: 'Children', key: 'childCount' },
  { header: 'Subtotal (INR)', key: 'subtotal' },
  { header: 'GST (INR)', key: 'tax' },
  { header: 'Total (INR)', key: 'total' },
  { header: 'Status', key: 'status' },
  { header: 'Payment status', key: 'paymentStatus' },
  { header: 'Payment method', value: (b) => b.paymentMethod || '' },
  { header: 'Transaction ID', value: (b) => b.transactionId || '' },
  { header: 'Created at', key: 'createdAt' },
];

export function BookingDetailsModal({ booking: b, onClose }) {
  return (
    <Modal open={!!b} onClose={onClose} title="Booking details" size="lg">
      {b && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-display text-xl font-bold">{b.id}</p>
            <StatusBadge status={b.status} /><PaymentBadge status={b.paymentStatus} />
            {b.isDemo && <DemoBadge />}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[[CalendarDays, 'Visit date', formatDate(b.visitDate, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })], [Clock3, 'Entry time', formatTime(b.entryTime)], [Ticket, 'Ticket', `${b.planLabel} × ${b.quantity}`], [Mail, 'Email', b.email || '—'], [Phone, 'Phone', b.phone || '—'], [CalendarDays, 'Created', formatDateTime(b.createdAt)]].map(([Icon, label, value]) => (
              <div key={label} className="flex items-center gap-3 rounded-xl bg-navy-50/60 px-3 py-2.5">
                <Icon className="h-4 w-4 text-aqua-500" />
                <div className="min-w-0"><p className="text-[11px] font-semibold uppercase tracking-wider text-navy-400">{label}</p><p className="truncate text-sm font-medium">{value}</p></div>
              </div>
            ))}
          </div>
          <div>
            <h4 className="mb-2 text-sm font-semibold text-navy-500">Visitors</h4>
            <div className="overflow-hidden rounded-xl ring-1 ring-navy-100">
              <table className="w-full text-sm">
                <thead className="bg-navy-50/60 text-left text-xs uppercase tracking-wider text-navy-400"><tr><th className="px-3 py-2">Name</th><th className="px-3 py-2">Age</th><th className="px-3 py-2">Gender</th></tr></thead>
                <tbody className="divide-y divide-navy-50">{b.visitors.map((v, i) => <tr key={i}><td className="px-3 py-2">{v.name}</td><td className="px-3 py-2">{v.age}</td><td className="px-3 py-2 capitalize">{v.gender}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Box label="Subtotal" value={formatINR(b.subtotal)} />
            <Box label="GST" value={formatINR(b.tax)} />
            <Box label="Total" value={formatINR(b.total)} strong />
          </div>
          {(b.paymentMethod || b.transactionId) && <p className="text-sm text-navy-500">Payment: {b.paymentMethod || '—'} · Ref: <span className="font-mono">{b.transactionId || '—'}</span></p>}
          {b.cancelReason && <p className="text-sm text-navy-500">Cancellation reason: <strong>{b.cancelReason}</strong> · Refund {formatINR(b.refundAmount)}</p>}
          {b.abandonedStage && <p className="text-sm text-navy-500">Dropped off at: <strong>{b.abandonedStage}</strong></p>}
        </div>
      )}
    </Modal>
  );
}

function Box({ label, value, strong }) {
  return <div className={strong ? 'rounded-xl bg-navy-900 px-4 py-3 text-white' : 'rounded-xl bg-navy-50/60 px-4 py-3'}><p className={strong ? 'text-xs text-navy-200' : 'text-xs text-navy-400'}>{label}</p><p className="font-display text-lg font-bold">{value}</p></div>;
}
