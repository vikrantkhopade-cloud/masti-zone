import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Banknote, CheckCircle2, Clock4, CreditCard, Download, HelpCircle, Receipt, RotateCcw, XCircle } from 'lucide-react';
import { AdminPageHeader, ChartCard, DateRangeFilter, StatCard, useAdminFilters } from '../../components/admin/AdminUI.jsx';
import DataTable from '../../components/admin/DataTable.jsx';
import DonutChart from '../../components/admin/DonutChart.jsx';
import { BookingDetailsModal, bookingCsvColumns, bookingSearch, col } from '../../components/admin/bookingTable.jsx';
import Badge, { PaymentBadge, StatusBadge } from '../../components/ui/Badge.jsx';
import Button from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Form.jsx';
import { Modal, Notice } from '../../components/ui/Misc.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/StateViews.jsx';
import { useAsync } from '../../hooks/useAsync.js';
import { useRangeBookings } from '../../hooks/useAnalytics.js';
import { adminService } from '../../services/adminService.js';
import { downloadCSV } from '../../utils/csv.js';
import { cn, formatCompactINR, formatDate, formatDateTime, formatINR, formatNumber } from '../../utils/format.js';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'paid', label: 'Paid' },
  { id: 'pending', label: 'Pending' },
  { id: 'failed', label: 'Failed' },
  { id: 'refunded', label: 'Refunded' },
];

export default function Payments() {
  const { range } = useAdminFilters();
  const { data, loading, error, reload } = useRangeBookings();
  const txns = useAsync(() => adminService.listPayments({ range }), [range.from, range.to]);
  const claims = useAsync(() => adminService.listUpiClaims(), []);
  const [filter, setFilter] = useState('all');
  const [selected, setSelected] = useState(null);
  const [applying, setApplying] = useState(null); // { bookingId, utr, claimedAmount }
  const [confirmed, setConfirmed] = useState(false);
  const [amountAcknowledged, setAmountAcknowledged] = useState(false);
  const [saving, setSaving] = useState(false);
  const [actionStatus, setActionStatus] = useState(null);
  // Live validation state for the booking/UTR currently typed into the
  // "Verify & apply" modal — re-checked on every change, not just once
  // when the modal opens, so correcting a mis-parsed ID gets fresh feedback.
  const [checking, setChecking] = useState(false);
  const [matchedBooking, setMatchedBooking] = useState(undefined); // undefined = not checked, null = not found
  const [duplicateOf, setDuplicateOf] = useState(null);
  const [checkError, setCheckError] = useState(null);

  // Payments = every booking that reached the payment step.
  const payments = useMemo(() => (data || []).filter((b) => b.paymentStatus !== 'not_initiated' && b.paymentStatus !== 'not_charged'), [data]);
  const rows = useMemo(() => {
    if (filter === 'all') return payments;
    if (filter === 'refunded') return payments.filter((b) => b.paymentStatus === 'refunded' || b.paymentStatus === 'refund_pending');
    return payments.filter((b) => b.paymentStatus === filter);
  }, [payments, filter]);

  const sum = (s) => payments.filter((b) => s.includes(b.paymentStatus)).reduce((t, b) => t + b.total, 0);
  const cnt = (s) => payments.filter((b) => s.includes(b.paymentStatus)).length;
  const methods = useMemo(() => {
    const m = {};
    payments.filter((b) => b.paymentStatus === 'paid').forEach((b) => { m[b.paymentMethod] = (m[b.paymentMethod] || 0) + b.total; });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [payments]);

  // contact_messages has no "resolved" flag (no schema change made for
  // this) — a claim is shown as resolved once its referenced booking is
  // already paid in the CURRENTLY selected date range. Widen the range to
  // check older claims if needed.
  const isClaimResolved = (claim) => (data || []).find((b) => b.id === claim.bookingId)?.paymentStatus === 'paid';

  const openApply = (claim) => {
    setApplying({ bookingId: claim.bookingId || '', utr: claim.utr || '', claimedAmount: claim.claimedAmount });
    setConfirmed(false);
    setAmountAcknowledged(false);
    setMatchedBooking(undefined);
    setDuplicateOf(null);
    setCheckError(null);
    setActionStatus(null);
  };

  // Re-validates the currently-typed Booking ID / UTR against the real
  // database — not just once when the modal opens, but every time either
  // field changes, so fixing a mis-parsed ID or a typo gets fresh feedback
  // before the admin can approve anything.
  useEffect(() => {
    if (!applying) return undefined;
    const bookingId = applying.bookingId.trim();
    const utr = applying.utr.trim();
    if (!bookingId) { setMatchedBooking(null); setDuplicateOf(null); return undefined; }
    let active = true;
    setChecking(true);
    setCheckError(null);
    const timer = setTimeout(async () => {
      try {
        const [booking, dupe] = await Promise.all([
          adminService.verifyBooking(bookingId),
          utr ? adminService.findDuplicateUtrBooking(utr, bookingId) : Promise.resolve(null),
        ]);
        if (!active) return;
        setMatchedBooking(booking);
        setDuplicateOf(dupe);
      } catch (err) {
        if (active) setCheckError(err.message || 'Could not verify this booking.');
      } finally {
        if (active) setChecking(false);
      }
    }, 350);
    return () => { active = false; clearTimeout(timer); };
  }, [applying?.bookingId, applying?.utr]);

  const amountMismatch = !!(matchedBooking && applying?.claimedAmount != null && Math.abs(matchedBooking.total - applying.claimedAmount) > 1);
  const notFound = matchedBooking === null;
  const canApprove = !!applying?.bookingId.trim() && !checking && !notFound && !duplicateOf && confirmed && (!amountMismatch || amountAcknowledged);

  const onConfirmApply = async () => {
    setSaving(true);
    try {
      const updated = await adminService.applyUpiPayment(applying.bookingId.trim(), applying.utr.trim());
      setActionStatus({ type: 'success', message: `Booking ${updated.id} marked as paid via UPI.` });
      setApplying(null);
      reload();
    } catch (err) {
      setActionStatus({ type: 'error', message: err.message || 'Could not apply this payment.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <AdminPageHeader title="Payment Management" subtitle="Monitor collections, pending and failed payments, and refunds." />
      <Notice tone="warn" className="mb-6">No payment gateway is connected. Customers pay directly via UPI and submit a transaction reference — nothing is ever marked Paid automatically. Review each claim below against your own bank/UPI statement before applying it. The transaction ledger (<span className="font-mono">public.payments</span>) further down is separate and genuinely empty until a gateway is connected.</Notice>
      {actionStatus && (
        <Notice tone={actionStatus.type === 'error' ? 'warn' : 'info'} className="mb-6" title={actionStatus.type === 'error' ? 'Action failed' : 'Done'}>{actionStatus.message}</Notice>
      )}
      <DateRangeFilter />

      <div className="mb-6 grid gap-6 xl:grid-cols-12">
        <div className="grid grid-cols-2 gap-4 xl:col-span-8">
          <StatCard loading={loading} icon={CheckCircle2} label="Collected" value={formatCompactINR(sum(['paid']))} hint={`${formatNumber(cnt(['paid']))} payments`} tone="green" />
          <StatCard loading={loading} icon={Clock4} label="Pending" value={formatCompactINR(sum(['pending']))} hint={`${formatNumber(cnt(['pending']))} payments`} tone="amber" />
          <StatCard loading={loading} icon={XCircle} label="Failed" value={formatNumber(cnt(['failed']))} hint={formatINR(sum(['failed']))} tone="red" />
          <StatCard loading={loading} icon={RotateCcw} label="Refunds" value={formatNumber(cnt(['refunded', 'refund_pending']))} hint={`${cnt(['refund_pending'])} awaiting refund`} tone="violet" />
        </div>
        <ChartCard loading={loading} className="xl:col-span-4" title="Collections by method" height={250}>
          <DonutChart data={methods} centerLabel="collected" valueFormatter={formatCompactINR} />
        </ChartCard>
      </div>

      <DataTable
        loading={loading} error={error} onRetry={reload} rows={rows} onRowClick={setSelected}
        searchFn={(b) => `${bookingSearch(b)} ${b.transactionId || ''}`} searchPlaceholder="Search booking, transaction ref…" emptyIcon={CreditCard}
        columns={[
          { key: 'transactionId', header: 'Transaction ref', render: (b) => <span className="font-mono text-xs">{b.transactionId || '— awaiting gateway —'}</span> },
          col.id, col.customer,
          { key: 'paymentMethod', header: 'Method', render: (b) => b.paymentMethod || '—' },
          col.total, col.payment, col.created,
        ]}
        initialSort={{ key: 'createdAt', dir: 'desc' }}
        toolbar={(
          <>
            <div className="flex flex-wrap gap-1">
              {FILTERS.map((f) => <button key={f.id} onClick={() => setFilter(f.id)} className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold', filter === f.id ? 'bg-navy-900 text-white' : 'bg-navy-50 text-navy-500 hover:text-navy-800')}>{f.label}</button>)}
            </div>
            <Button size="sm" variant="outline" disabled={!rows.length} onClick={() => downloadCSV(`payments_${range.from}_to_${range.to}`, rows, bookingCsvColumns)}><Download className="h-4 w-4" />Export</Button>
          </>
        )}
      />

      <div className="mt-6">
        <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-navy-900"><Banknote className="h-4 w-4 text-aqua-500" />UPI Payment Claims</h2>
        <p className="mb-4 text-sm text-navy-500">Transaction references customers submitted after paying via UPI. Verify each one against your own bank/UPI statement before applying it — never trust a reference alone as proof of payment.</p>
        {claims.loading ? (
          <Skeleton className="h-32 rounded-2xl" />
        ) : claims.error ? (
          <ErrorState error={claims.error} onRetry={claims.reload} />
        ) : !claims.data?.length ? (
          <EmptyState icon={Banknote} title="No UPI payment claims yet" description="Submissions from the Checkout and Confirmation pages will appear here." />
        ) : (
          <div className="overflow-x-auto rounded-2xl ring-1 ring-navy-100">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-navy-50/50 text-left text-xs uppercase tracking-wider text-navy-400">
                <tr><th className="px-4 py-3">Booking</th><th className="px-4 py-3">Submitted by</th><th className="px-4 py-3">UTR / Reference</th><th className="px-4 py-3">Claimed amount</th><th className="px-4 py-3">Submitted</th><th className="px-4 py-3 text-right">Action</th></tr>
              </thead>
              <tbody className="divide-y divide-navy-50">
                {claims.data.map((claim) => {
                  const resolved = isClaimResolved(claim);
                  const unparsed = !claim.bookingId;
                  return (
                    <tr key={claim.id} className={resolved ? 'opacity-50' : ''}>
                      <td className="px-4 py-3 font-semibold text-navy-900">
                        {claim.bookingId || <span className="inline-flex items-center gap-1 font-normal text-amber-600"><HelpCircle className="h-3.5 w-3.5" />Could not parse — see raw message</span>}
                      </td>
                      <td className="px-4 py-3 text-navy-600">{claim.name}<p className="text-xs text-navy-400">{claim.email}</p></td>
                      <td className="px-4 py-3 font-mono text-xs text-navy-700">{claim.utr || '—'}</td>
                      <td className="px-4 py-3 text-navy-700">{claim.claimedAmount != null ? formatINR(claim.claimedAmount) : '—'}</td>
                      <td className="px-4 py-3 text-navy-500">{formatDateTime(claim.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        {resolved ? <Badge tone="green">Resolved</Badge> : <Button size="sm" variant="outline" onClick={() => openApply(claim)}>{unparsed ? 'Review' : 'Verify & apply'}</Button>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-6">
        <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-navy-900"><Receipt className="h-4 w-4 text-aqua-500" />Transaction Records</h2>
        <p className="mb-4 text-sm text-navy-500">Real rows from the <span className="font-mono">payments</span> table — separate from the booking-level status above, and genuinely empty until a payment gateway writes to it.</p>
        {txns.loading ? (
          <Skeleton className="h-32 rounded-2xl" />
        ) : txns.error ? (
          <ErrorState error={txns.error} onRetry={txns.reload} />
        ) : !txns.data?.length ? (
          <EmptyState icon={Receipt} title="No transaction records in this range" description="This table is only populated once a payment gateway is connected — nothing here is simulated." />
        ) : (
          <DataTable
            loading={false} rows={txns.data}
            columns={[
              { key: 'id', header: 'Payment ID', render: (p) => <span className="font-mono text-xs">{p.id}</span> },
              { key: 'bookingId', header: 'Booking', render: (p) => <span className="font-semibold text-navy-900">{p.bookingId}</span> },
              { key: 'amount', header: 'Amount', align: 'right', render: (p) => formatINR(p.amount) },
              { key: 'method', header: 'Method', render: (p) => p.method || '—' },
              { key: 'status', header: 'Status', render: (p) => <span className="capitalize">{p.status}</span> },
              { key: 'createdAt', header: 'Created', render: (p) => formatDateTime(p.createdAt) },
            ]}
            initialSort={{ key: 'createdAt', dir: 'desc' }}
            toolbar={<Button size="sm" variant="outline" disabled={!txns.data.length} onClick={() => downloadCSV(`transactions_${range.from}_to_${range.to}`, txns.data, [{ header: 'Payment ID', key: 'id' }, { header: 'Booking ID', key: 'bookingId' }, { header: 'Amount (INR)', key: 'amount' }, { header: 'Method', value: (p) => p.method || '' }, { header: 'Status', key: 'status' }, { header: 'Created at', key: 'createdAt' }])}><Download className="h-4 w-4" />Export</Button>}
          />
        )}
      </div>

      <BookingDetailsModal booking={selected} onClose={() => setSelected(null)} />

      <Modal open={!!applying} onClose={() => setApplying(null)} title="Verify & apply UPI payment" size="lg"
        footer={<><Button variant="ghost" onClick={() => setApplying(null)}>Cancel</Button><Button variant="primary" disabled={!canApprove} loading={saving} onClick={onConfirmApply}>Mark as paid</Button></>}>
        {applying && (
          <div className="space-y-4">
            <Notice tone="warn" title="A submitted reference is never proof of payment by itself">
              Confirm the booking, amount and UTR below actually match what you see in your own bank/UPI statement before approving — nothing here is verified automatically.
            </Notice>

            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Booking ID" value={applying.bookingId} onChange={(e) => setApplying({ ...applying, bookingId: e.target.value })} placeholder="e.g. MZ-ABC123" />
              <Input label="UPI Transaction ID / UTR" value={applying.utr} onChange={(e) => setApplying({ ...applying, utr: e.target.value })} />
            </div>

            {checking ? (
              <Skeleton className="h-28 rounded-xl" />
            ) : checkError ? (
              <Notice tone="warn" title="Lookup failed">{checkError}</Notice>
            ) : notFound ? (
              <Notice tone="warn" title="No booking found">No booking matches &ldquo;{applying.bookingId}&rdquo;. Correct the Booking ID above — approval stays disabled until a real booking is found.</Notice>
            ) : matchedBooking ? (
              <div className="rounded-xl bg-navy-50/60 p-4">
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-navy-400">Matched booking <StatusBadge status={matchedBooking.status} /><PaymentBadge status={matchedBooking.paymentStatus} /></p>
                <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                  <div><dt className="text-xs text-navy-400">Customer</dt><dd className="font-semibold text-navy-900">{matchedBooking.customerName}</dd></div>
                  <div><dt className="text-xs text-navy-400">Email / Phone</dt><dd className="text-navy-700">{matchedBooking.email}<br />{matchedBooking.phone}</dd></div>
                  <div><dt className="text-xs text-navy-400">Visit date</dt><dd className="text-navy-700">{formatDate(matchedBooking.visitDate)}</dd></div>
                  <div><dt className="text-xs text-navy-400">Expected amount</dt><dd className={cn('font-bold', amountMismatch ? 'text-red-600' : 'text-navy-900')}>{formatINR(matchedBooking.total)}</dd></div>
                  <div><dt className="text-xs text-navy-400">Claimed amount</dt><dd className={cn('font-semibold', amountMismatch ? 'text-red-600' : 'text-navy-700')}>{applying.claimedAmount != null ? formatINR(applying.claimedAmount) : 'Not stated'}</dd></div>
                </dl>
              </div>
            ) : null}

            {duplicateOf && (
              <Notice tone="warn" title="This UTR is already applied elsewhere">This exact UTR is already recorded on booking <strong>{duplicateOf}</strong>. The same transaction cannot be applied to two bookings — approval is disabled.</Notice>
            )}

            {amountMismatch && !duplicateOf && !notFound && (
              <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-red-50 p-3 text-sm text-red-700">
                <input type="checkbox" checked={amountAcknowledged} onChange={(e) => setAmountAcknowledged(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-red-300 text-red-600" />
                <span>The claimed amount doesn't match this booking's total. I've independently confirmed the correct amount was paid before approving anyway.</span>
              </label>
            )}

            <label className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-navy-50/60 p-3 text-sm text-navy-700">
              <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} className="mt-0.5 h-4 w-4 rounded border-navy-200 text-aqua-500" />
              <span className="flex items-start gap-1.5"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-500" />I have personally verified this exact transaction, for this exact booking and amount, in our bank/UPI account.</span>
            </label>
          </div>
        )}
      </Modal>
    </>
  );
}
