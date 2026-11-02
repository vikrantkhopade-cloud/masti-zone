import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Ban, CheckCircle2, Clock4, HelpCircle, Search } from 'lucide-react';
import { AdminPageHeader } from '../../components/admin/AdminUI.jsx';
import Card from '../../components/ui/Card.jsx';
import Button from '../../components/ui/Button.jsx';
import { PaymentBadge, StatusBadge } from '../../components/ui/Badge.jsx';
import { Input } from '../../components/ui/Form.jsx';
import { Notice } from '../../components/ui/Misc.jsx';
import { Skeleton } from '../../components/ui/StateViews.jsx';
import { adminService } from '../../services/adminService.js';
import { formatDate, formatDateTime, formatINR, formatTime } from '../../utils/format.js';

// `result`: undefined = nothing looked up yet, null = looked up but not
// found, object = the booking. Kept distinct from `error` (a failed query)
// so "not found" and "query failed" never render the same way.
export default function VerifyTicket() {
  const { bookingId: paramId } = useParams();
  const [query, setQuery] = useState(paramId || '');
  const [state, setState] = useState({ loading: false, result: undefined, error: null });

  const runLookup = async (id) => {
    const value = (id || '').trim();
    if (!value) return;
    setState({ loading: true, result: undefined, error: null });
    try {
      const booking = await adminService.verifyBooking(value);
      setState({ loading: false, result: booking, error: null });
    } catch (err) {
      setState({ loading: false, result: undefined, error: err.message || 'Could not look up this booking.' });
    }
  };

  // A QR scan (opened via a phone's own camera app) lands here with the
  // booking ID already in the URL — auto-run the lookup in that case.
  useEffect(() => { if (paramId) runLookup(paramId); }, [paramId]);

  const onSubmit = (e) => { e.preventDefault(); runLookup(query); };

  const booking = state.result;
  // Never equate "exists" with "valid for entry" — only a genuinely
  // confirmed booking counts, regardless of what a QR code claims.
  const verdict = !booking ? null : booking.status === 'cancelled' ? 'cancelled' : booking.status !== 'confirmed' ? 'pending' : 'valid';

  return (
    <>
      <AdminPageHeader title="Verify Ticket" subtitle="Scan a guest's QR code with your phone's camera (it opens this page automatically), or enter a booking ID manually." />
      <Card className="mb-6">
        <form onSubmit={onSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Input className="flex-1" label="Booking ID" placeholder="e.g. MZ-ABC123" value={query} onChange={(e) => setQuery(e.target.value)} icon={Search} />
          <Button type="submit" loading={state.loading}>Verify</Button>
        </form>
      </Card>

      {state.loading ? (
        <Skeleton className="h-56 rounded-2xl" />
      ) : state.error ? (
        <Notice tone="warn" title="Lookup failed">{state.error}</Notice>
      ) : state.result === undefined ? (
        <Card className="flex flex-col items-center gap-2 py-14 text-center text-navy-400">
          <HelpCircle className="h-8 w-8" />
          <p className="text-sm">Enter or scan a booking ID to verify it.</p>
        </Card>
      ) : booking === null ? (
        <Card className="flex flex-col items-center gap-3 py-14 text-center">
          <Ban className="h-10 w-10 text-red-500" />
          <p className="text-lg font-semibold text-navy-900">Booking not found</p>
          <p className="text-sm text-navy-500">No booking matches &ldquo;{query}&rdquo;. Double-check the ID and try again.</p>
        </Card>
      ) : (
        <Card>
          <div className={`mb-5 flex items-center gap-3 rounded-xl p-4 ${verdict === 'valid' ? 'bg-emerald-50' : verdict === 'cancelled' ? 'bg-red-50' : 'bg-amber-50'}`}>
            {verdict === 'valid' ? <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" /> : verdict === 'cancelled' ? <Ban className="h-6 w-6 shrink-0 text-red-600" /> : <Clock4 className="h-6 w-6 shrink-0 text-amber-600" />}
            <div>
              <p className={`font-semibold ${verdict === 'valid' ? 'text-emerald-700' : verdict === 'cancelled' ? 'text-red-700' : 'text-amber-700'}`}>
                {verdict === 'valid' ? 'Valid — confirmed booking' : verdict === 'cancelled' ? 'Cancelled — do not admit' : 'Not confirmed — do not admit as paid'}
              </p>
              <p className="text-sm text-navy-500">
                {verdict === 'valid' ? 'Booking status is confirmed.' : verdict === 'cancelled' ? 'This booking was cancelled by the guest.' : 'Payment has not been confirmed for this booking yet.'}
              </p>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2"><StatusBadge status={booking.status} /><PaymentBadge status={booking.paymentStatus} /></div>

          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ['Booking ID', booking.id],
              ['Customer', booking.customerName || '—'],
              ['Visit date', formatDate(booking.visitDate, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })],
              ['Entry time', formatTime(booking.entryTime)],
              ['Ticket', booking.planLabel],
              ['Visitors', `${booking.quantity} (${booking.adultCount}A · ${booking.childCount}C)`],
              ['Amount', formatINR(booking.total)],
              ['Created', formatDateTime(booking.createdAt)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-xs font-semibold uppercase tracking-wider text-navy-400">{label}</dt>
                <dd className="mt-1 font-semibold text-navy-900">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-6">
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wider text-navy-400">Visitors</h3>
            <ul className="divide-y divide-navy-50 rounded-xl ring-1 ring-navy-100">
              {booking.visitors.map((v, i) => (
                <li key={i} className="flex items-center justify-between px-4 py-2.5 text-sm">
                  <span className="font-medium text-navy-800">{v.name}</span>
                  <span className="text-navy-500">{v.age} yrs · <span className="capitalize">{v.gender}</span></span>
                </li>
              ))}
              {booking.visitors.length === 0 && <li className="px-4 py-3 text-sm text-navy-400">No visitor details recorded.</li>}
            </ul>
          </div>
        </Card>
      )}
    </>
  );
}
